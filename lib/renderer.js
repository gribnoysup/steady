// @ts-check
let renderReactPage = (Component, props = {}) => {
  let React;
  let ReactDOMServer;

  try {
    React = require(require.resolve('react'));
    ReactDOMServer = require(require.resolve('react-dom/server'));
  } catch (error) {
    throw new TypeError(
      'Default page render requires React to be installed. Either React or ReactDOM could not be resolved in your dependencies thus the build can not proceed. Please check your dependencies and install react or react-dom if they are missing:\n\n  npm i --save react react-dom'
    );
  }

  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(Component, props)
  );
};

module.exports = { renderReactPage };