#!/usr/bin/env node

let { name, version } = require('../package.json');
let cli = require('sade')(name);

let build = require('../lib/build');

cli
  .version(version)
  .option(
    '-c, --config',
    'Path to Steady config file that allows to modify default webpack configuration'
  );

cli
  .command('build')
  .describe('Generage static webpage assets')
  .action(({ config }) => {
    build(config);
  });

cli.parse(process.argv);
