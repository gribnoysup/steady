# Steady

Generate completely\* static html pages from your React code

<small>\* - with an escape hatch</small>

## Disclaimer

This project is pretty silly, was made to solve my special use-case and was
mostly an experiment to play around with `create-*` tools idea and
`babel-macros`. It is nowhere near done and polished. Think twice before
using it, but feel free to examine code and learn from it!

## What Is Steady?

Steady is static webpage generator for your React application. Sometimes all you
want to send to your webpage visitors over the wire is only HTML and CSS, but it
would be nice to generate it using modern bundling tools that allow quick
iteration over your work, build it using reusable (or maybe already existing)
code and apply automated optimizations to what you built.

When building a webpage with Steady, you are writing code with React framework
and can use any js dependencies of your choice. Want to use `date-fns` for date
formatting? Sure! Want your favourite flavour of `css-in-js`? Why not!

Just keep in mind one thing: when you bundle your webpage with `build` command,
your JavaScript bundle is not "emitted" by Webpack and not included on the page.
You are building a React application, but it will be executed only on server to
generate initial page markup with `ReactDOMServer.renderToStaticMarkup`.

## Quick Start

The commands below will generate Steady project from template, go into the
project folder and start Steady in dev mode

```sh
npx @steady/scripts create my-awesome-project
cd my-awesome-project
npm run start
```

## Why Not Some Other React Static Generator?

All React webpage generators that I saw in the wild are still including
JavaScript on the page. The goal of Steady is to generate pages with almost zero
JavaScript and to avoid sending React/ReactDOM itself to the client. But there
are a bunch of those out there, all of them are awesome in their own way, and it
is probably a much better idea to use one of them:

- [Next.js](https://nextjs.org/)
- [Navi](https://frontarm.com/navi/)
- [react-static](https://github.com/nozzle/react-static/)
- [razzle](https://github.com/jaredpalmer/razzle)
- [Gatsby](https://www.gatsbyjs.org/)

## What Is Included?

Most of the Webpack config is almost the same as Create React App Webpack
configuration, so things that are supported in CRA, should work in Steady also:
javascript processed with `babel`, css and css-modules with `postcss` applied to
the output, `url-loader` for small images, `file-loader` for everything else

There are two additional features added to Steady by default:

- `responsive-loader` to generate resized versions of the images
- `critters-webpack-plugin` to extract and inline critical CSS right on the page

## How It Works?

There is one Webpack config that produces all the assets, using `src/index.js`
as a main entry point. When the assets are produced, special
[`PrerenderHtmlWebpackPlugin`](https://github.com/gribnoysup/steady-scripts/blob/master/lib/PrerenderHTMLWebpackPlugin.js)
plugin in combination with `HtmlWebpackPlugin` is used to evaluate main
JavaScript chunk and render it to string using
[default renderer](https://github.com/gribnoysup/steady-scripts/blob/081dddcbc5f6e0db6c27c3f34aa0550fe907c7ff/lib/renderer.js#L2).
After HTML is generated, all files, except JavaScript, are emitted.

In the dev mode it is the same procedure, but BrowsersyncPluginWebpack is used
to serve the dist folder, providing live reload features.

## Steady Macros

Steady comes with two macroses: `Window` and `Component`, that will allow you to
use JavaScript on our page, but very minimally.

### Component Macro

`Component` macro will allow you to attach DOM events to your React components
in the generated markup. Import the macro and replace your component with
`Component`. You need to specify `as` attribute on the component to tell the
macro how it should be rendered. Now if you use standard react event handlers,
they will work in the produced build:

```jsx
import { Component } from '@steady/scripts/macro';

export default () => (
  <Component
    as="button"
    onClick={() => {
      console.log('button was clicked!');
    }}
  >
    Click me
  </Component>
);
```

Code above will be compiled by babel to the following React component tree:

```jsx
export default () => (
  <>
    <button id="uid">Click me</button>
    <script
      dangerouslySetInnerHTML={{
        __html:
          "button.addEventListener('click', function() { console.log('button was clicked!'); });",
      }}
    />
  </>
);
```

And will render markup like this at the end:

```html
<button id="uid">Click me</button>
<script>
  button.addEventListener('click', function() {
    console.log('button was clicked!');
  });
</script>
```

### Windiw Macro

`Window` macro works almost the same way as `Component` macro. Instead of
attaching events to DOM elements, it will attach them to window:

```jsx
import { Window } from '@steady/scripts/macro';

export default () => (
  <Window
    onLoad={() => {
      console.log('page loaded!');
    }}
  >
    <div>Steady page</div>
  </Window>
);
```

Code above will generate React tree like this:

```jsx
export default () => (
  <>
    <div>Steady page</div>
    <script
      dangerouslySetInnerHTML={{
        __html:
          "window.addEventListener('load', function() { console.log('page loaded!'); });",
      }}
    />
  </>
);
```

And will render markup like this:

```html
<div>Steady page</div>
<script>
  window.addEventListener('load', function() {
    console.log('page loaded!');
  });
</script>
```

### Macros Limitations

At the moment you can't use local variables from the outer scope of the
function, they will not be available in the generated code.

## Overriding Defaults

### Changing Render Method with `_render.js`

As mentioned above, by default Steady will render your webpage with React
renderer. You can change this behaviour by providing your own render method. To
do this, create `src/_render.js` file. This module should export async function
that will get HtmlWebpackPlugin data as first argument and should return a
string of rendered markup:

```jsx
// file: src/_render.js

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fetch from 'node-fetch';

import Document from './index.js';

export default async htmlPluginData => {
  let response = await fetch('data-from-api.json');
  let data = await response.json();

  return ReactDOMServer.renderToStaticMarkup(
    <Document data={data} htmlPluginData={htmlPluginData} />
  );
};
```

## Steady CLI

### `steady create`

Creates Steady project in `<project-directory>` from template. Available
templates are `react-cra` and `react-minimal`, default template is `react-cra`

#### Usage

```sh
npx @steady/scripts create <project-directory> [options]
```

#### Options

| Option                  | Description                                          | Default                    |
| ----------------------- | ---------------------------------------------------- | -------------------------- |
| `-t, --template`        | Template that will be used to generate the project   | `"react-cra"`              |
| `-s, --scripts-version` | Custom Steady scripts version                        | `"@steady/scripts@latest"` |
| `-c, --commit`          | Create initial commit (use `--no-commit` to disable) | `true`                     |

#### Example

```sh
npx @steady/scripts ./my-awesome-project --template react-minimal
```

### `steady start`

Starts dev server for a Steady project. Will be provided as npm start command by
default in any project created with Steady `create` command

#### Usage

```sh
npx @steady/scripts start
```

### `steady build`

Generates productin-ready web page assets in the `dist` folder

#### Usage

```sh
npx @steady/scripts build
```

## TODO

- [ ] babel macro for small script tag injections to support binding events to
      DOM to an extent
  - [x] initial implementation
  - [x] window events
  - [ ] data from outer scope of functions through data-attrs
- [ ] more CRA2 features: typescript, opt-in scss (?)
- [x] create command to generate initial application structure
- [ ] multiple routes support
- [ ] better docs

## LICENSE

ISC
