#!/usr/bin/env node

let { name, version } = require('../package.json');
let cli = require('sade')(name);

let create = require('../lib/create');
let start = require('../lib/start');
let build = require('../lib/build');

cli.version(version);

cli
  .command('create <project-directory>')
  .describe('Create Steady projet from template')
  .example('./my-awesome-project --template react-minimal')
  .option(
    '-t, --template',
    'Template that will be used to generate the project',
    'react-cra'
  )
  .option(
    '-s, --scripts-version',
    'Custom Steady scripts version',
    '@steady/scripts@latest'
  )
  .option(
    '-c, --commit',
    'Create initial commit (use --no-commit to disable)',
    true
  )
  .action(
    (projectDir, { template, commit, 'scripts-version': scriptsVersion }) => {
      create({ projectDir, template, commit, scriptsVersion });
    }
  );

cli
  .command('start')
  .describe('Start Steady dev server')
  .example('-c steady.config.js')
  .option(
    '-c, --config',
    'Path to Steady config file that allows to modify default webpack configuration'
  )
  .action(({ config }) => {
    start(config);
  });

cli
  .command('build')
  .describe('Generage static webpage assets')
  .example('-c steady.config.js')
  .option(
    '-c, --config',
    'Path to Steady config file that allows to modify default webpack configuration'
  )
  .action(({ config }) => {
    build(config);
  });

cli.parse(process.argv);
