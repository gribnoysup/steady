let path = require('path');

module.exports = {
  // Default src dir
  appSrcDir: path.resolve(process.cwd(), 'src'),
  // Default app path
  appSrc: path.resolve(process.cwd(), 'src', 'index.js'),
  // Allows to override the default renderToString method for the page
  appRenderer: path.resolve(process.cwd(), 'src', '_render.js'),
  // Stores temporary build files
  outputDir: path.resolve(process.cwd(), 'dist'),
  // Babel config
  babelrc: path.resolve(__dirname, 'babel.js'),
  // Application babel config
  appBabelrc: path.resolve(process.cwd(), 'babel.config.js'),
  // HTML template
  htmlTemplate: path.resolve(__dirname, '..', 'lib', 'template.html'),
  // Project temlpates dir
  templates: path.resolve(__dirname, '..', 'templates'),
  // Default page renderer
  defaultRenderer: path.resolve(__dirname, '..', 'lib', 'renderer.js'),
};
