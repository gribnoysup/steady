// let printAST = require('ast-pretty-print');
let { createMacro } = require('babel-plugin-macros');
let { template, types: t } = require('@babel/core');
let cuid = require('cuid');
let terser = require('terser');

let inlineScriptBabelConfig = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        loose: true,
        useBuiltIns: false,
      },
    ],
  ],
  plugins: [
    require.resolve('@babel/plugin-transform-destructuring'),
    [
      require.resolve('@babel/plugin-proposal-class-properties'),
      { loose: true },
    ],
    [
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      { useBuiltIns: true },
    ],
  ],
};

let jsxTemplate = str => template(str, { plugins: ['jsx'] });

let scriptTemplate = jsxTemplate(`
  <script dangerouslySetInnerHTML={{ __html: SOURCE }} />
`);

let iifeTemplate = template(`
  (function() {
    var currentScript = document.currentScript || (function() {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

    var previousSibiling =
      currentScript.previousElementSibling;

    var EVENT_TARGET =
      previousSibiling.id === TARGET_ID
        ? previousSibiling
        : previousSibiling.getElementById(TARGET_ID);

    CODE_BLOCK
  })();  
`);

let addListenerTemplate = template(`
  EVENT_TARGET.addEventListener(EVENT_NAME, EVENT_HANDLER);
`);

let fragment = (...children) =>
  t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);

/**
 * Additionally formats error created by buildCodeFrameError
 */
let createFormattedError = (path, message) => {
  let error = path.buildCodeFrameError('\n\n  ' + message + '\n');
  error.message = `\n\n${error.message}\n\n`;
  return error;
};

function SteadyMacro({ references, /** state, */ babel /**, source */ }) {
  let { transformFromAstSync } = babel;
  let { Component = [], Window = [] } = references || {};

  let codeFromAST = ast => {
    let { code } = transformFromAstSync(
      t.program([].concat(ast)),
      null,
      inlineScriptBabelConfig
    );

    return process.env.NODE_ENV === 'production'
      ? terser.minify(code).code
      : code;
  };

  /**
   * Returns string (both literal and expression with string)
   * value or identifier name of JSXAttribute if it is one of
   * those, othewrwise returns null
   */
  let getJSXAttributeValue = attrPath => {
    let value = attrPath.get('value').node;

    if (t.isStringLiteral(value)) {
      return value.value;
    } else if (t.isJSXExpressionContainer(value)) {
      let { expression } = value;
      return t.isStringLiteral(expression)
        ? expression.value
        : t.isIdentifier(expression)
        ? expression.name
        : null;
    }
  };

  /**
   * Goes through all JSXElement attributes and filters out
   * all that are matching event regex. Returns formatted
   * event name, event handler expression and path to attribute
   */
  let getAllEventHandlers = jsxElementPath => {
    return jsxElementPath
      .get('openingElement.attributes')
      .filter(path => /^on[A-Z]\w+$/.test(path.get('name.name').node))
      .map(path => {
        let eventName = path
          .get('name.name')
          .node.replace(/^on/, '')
          .toLowerCase();

        let eventHandler = path.get('value.expression');

        return { eventName, eventHandler, path };
      });
  };

  let replaceComponent = path => {
    if (
      // If path is JSXIdentifier (<Identifier <-- />)
      t.isJSXIdentifier(path) &&
      // ... and it is an opening one <Opening <--- ></Closing>
      t.isJSXOpeningElement(path.parentPath)
      // && path.get('name').node === 'Component'
    ) {
      // Get the whole JSXElement (our initial path is just opening element ident)
      let jsxElement = path.findParent(p => t.isJSXElement(p));
      // We are looking for an as attribute to figure out how
      // to actually render this component
      let asAttr = jsxElement
        .get('openingElement.attributes')
        .find(node => node.get('name.name').node === 'as');

      // We continue only if we found supported `as` attr, fail with a
      // meaningful error otherwise
      if (asAttr) {
        let asAttrValue = getJSXAttributeValue(asAttr);

        // Replace opening and closing JSX elements
        // with the value of `as` attr:
        //
        // <Component as="div" /> -> <div as="div" />
        //
        // <Component as="span">something</Component> -> <span as="span">something</span>
        if (asAttrValue) {
          jsxElement
            .get('openingElement.name')
            .replaceWith(t.jsxIdentifier(asAttrValue));

          if (jsxElement.get('closingElement').node) {
            jsxElement
              .get('closingElement.name')
              .replaceWith(t.jsxIdentifier(asAttrValue));
          }

          let eventHandlers = getAllEventHandlers(jsxElement);

          // If there are event handlers on the component, replace
          // `as` with unique id, generate code from handler AST and
          // put it in the script tag near the component
          //
          // <Component as="div" onClick={() => { console.log("Hello"); }} />
          //
          // <>
          //   <div id="unique" />
          //   <script
          //     dangerouslySetInnerHTML={{
          //       __html:
          //         "document.getElementById('unique').addEventListener('click', () => { console.log('Hello'); })"
          //     }}
          //   />
          // </>
          if (eventHandlers.length > 0) {
            let uid = cuid.slug();

            asAttr.replaceWith(
              t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(uid))
            );

            let target = t.identifier('eventTarget');

            let iife = iifeTemplate({
              EVENT_TARGET: target,
              TARGET_ID: t.stringLiteral(uid),
              CODE_BLOCK: eventHandlers.map(({ eventName, eventHandler }) =>
                addListenerTemplate({
                  EVENT_TARGET: target,
                  EVENT_NAME: t.stringLiteral(eventName),
                  EVENT_HANDLER: eventHandler.node,
                })
              ),
            });

            let { expression: jsxScriptTag } = scriptTemplate({
              SOURCE: t.stringLiteral(codeFromAST(iife)),
            });

            jsxElement.replaceWith(fragment(jsxElement.node, jsxScriptTag));

            eventHandlers.forEach(({ path }) => {
              path.remove();
            });
          } else {
            // Otherwise just remove the as attribute
            asAttr.remove();
          }
        } else {
          throw createFormattedError(
            path,
            '`as` attribute should be a string or another React Component: <Component as="div" />, <Component as={MyAwesomeButton} />'
          );
        }
      } else {
        throw createFormattedError(
          path,
          'Missing required `as` attribute on Component: <Component as="div" />'
        );
      }
    } else if (!t.isJSXIdentifier(path)) {
      throw createFormattedError(
        path,
        'You can use Component only as JSX Element: <Component as="div" />'
      );
    } else {
      // Ignore everything else
    }
  };

  let replaceWithWindowScripts = path => {
    if (t.isJSXIdentifier(path) && t.isJSXOpeningElement(path.parentPath)) {
      let jsxElement = path.findParent(p => t.isJSXElement(p));
      let eventHandlers = getAllEventHandlers(jsxElement);

      let jsxScriptTag;

      if (eventHandlers.length > 0) {
        let attachEventsAST = eventHandlers.map(({ eventName, eventHandler }) =>
          addListenerTemplate({
            EVENT_TARGET: t.identifier('window'),
            EVENT_NAME: t.stringLiteral(eventName),
            EVENT_HANDLER: eventHandler.node,
          })
        );

        ({ expression: jsxScriptTag } = scriptTemplate({
          SOURCE: t.stringLiteral(codeFromAST(attachEventsAST)),
        }));
      }

      jsxElement.replaceWith(
        fragment(...jsxElement.node.children.concat(jsxScriptTag || []))
      );
    } else if (!t.isJSXIdentifier(path)) {
      throw createFormattedError(
        path,
        'You can use Window only as JSX Element: <Window />'
      );
    } else {
      // Ignore everything else
    }
  };

  Component.forEach(path => {
    replaceComponent(path);
  });

  Window.forEach(path => {
    replaceWithWindowScripts(path);
  });
}

module.exports = createMacro(SteadyMacro);
