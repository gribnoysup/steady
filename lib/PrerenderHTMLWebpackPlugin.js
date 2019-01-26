// @ts-check
let requireFromString = require('require-from-string');

const PLUGIN_NAME = 'steady-prerender-html-webpack-plugin';

let stylesheet = href => `<link href="${href}" rel="stylesheet" />`;

let isJS = name => /\.js$/.test(name);

let requireFromChunkName = (chunkName, compilation) => {
  let chunk = compilation.chunks
    .find(chunk => chunk.name === chunkName)
    .files.find(isJS);

  if (!chunk) {
    throw new Error(`Couldn't find js assets for chunk "${chunkName}"`);
  }

  return requireFromString(compilation.assets[chunk].source(), chunk);
};

class PrerenderHTMLWebpackPlugin {
  constructor(options) {
    this.options = Object.assign({}, options || {});
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
        PLUGIN_NAME,
        (htmlPluginData, callback) => {
          this.process(compiler, compilation, htmlPluginData)
            .then(data => {
              callback(null, data);
            })
            .catch(callback);
        }
      );
    });
  }

  async process(compiler, compilation, htmlPluginData) {
    let { assets } = htmlPluginData;
    let { rendererChunkName, entryChunkName, includeCss } = this.options;

    let { default: render } = requireFromChunkName(
      rendererChunkName,
      compilation
    );

    let { default: Document } = requireFromChunkName(
      entryChunkName,
      compilation
    );

    htmlPluginData.html =
      htmlPluginData.html.trim() + (await render(Document, htmlPluginData));

    if (includeCss === true) {
      htmlPluginData.html = htmlPluginData.html.replace(
        /<\/head>/,
        assets.css.map(stylesheet).join('') + '</head>'
      );
    }

    return htmlPluginData;
  }
}

module.exports = PrerenderHTMLWebpackPlugin;
