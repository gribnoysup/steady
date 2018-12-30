// @ts-check
let path = require('path');
let requireFromString = require('require-from-string');

let { renderReactPage } = require('./renderer');

const PLUGIN_NAME = 'steady-prerender-html-webpack-plugin';

let stylesheet = href => `<link href="${href}" rel="stylesheet" />`;

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
    let { isCustomRenderMethodProvided, entryChunkName } = this.options;
    let { files } =
      compilation.chunks.find(chunk => chunk.name === entryChunkName) || {};

    let jsAsset = (files || []).find(name => /\.js$/.test(name));

    if (!jsAsset) {
      throw new TypeError('Expected to find js chunk. Found nothing');
    }

    let chunkSource = compilation.assets[jsAsset].source();
    let { default: Document } = requireFromString(chunkSource, jsAsset);

    htmlPluginData.html =
      htmlPluginData.html.trim() +
      (isCustomRenderMethodProvided ? Document() : renderReactPage(Document));

    htmlPluginData.html = htmlPluginData.html.replace(
      /<\/head>/,
      assets.css.map(stylesheet).join('') + '</head>'
    );

    return htmlPluginData;
  }
}

module.exports = PrerenderHTMLWebpackPlugin;
