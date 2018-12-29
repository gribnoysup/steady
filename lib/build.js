// @ts-check
process.env.NODE_ENV = 'production';

let fs = require('fs-extra');
let webpack = require('webpack');

let createConfig = require('./createWebpackConfig');

let build = async configPath => {
  // TODO: get config from path and apply to created webpack config
  let config = createConfig(createConfig.BUILD_MODE.Production);

  fs.emptyDirSync(config.output.path);

  let compiler = webpack(config);

  // TODO: check that required files exist before proceeding
  compiler.run((err, stats) => {
    if (err) {
      console.error(err.stack || err);

      if (err.details) {
        console.error(err.details);
      }

      return;
    }

    let info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors.join('\n\n'));
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings.join('\n\n'));
    }
  });
};

module.exports = build;