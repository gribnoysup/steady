// @ts-check
let fs = require('fs-extra');
let webpack = require('webpack');

let createConfig = require('./createWebpackConfig');

let start = async ({ config: configPath }) => {
  process.env.NODE_ENV = createConfig.BUILD_MODE.development;

  // TODO: get config from path and apply to created webpack config
  let config = createConfig(createConfig.BUILD_MODE.development);

  fs.emptyDirSync(config.output.path);

  let compiler = webpack(config);

  // TODO: check that required files exist before proceeding
  compiler.watch(
    {
      aggregateTimeout: 300,
      ignored: /node_modules/,
      poll: false,
    },
    (err, stats) => {
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
    }
  );
};

module.exports = start;
