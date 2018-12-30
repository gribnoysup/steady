#!/usr/bin/env node

let { name, version } = require('../package.json');
let cli = require('sade')(name);

let build = require('../lib/build');
let create = require('../lib/create');

cli.version(version);

cli
  .command('build')
  .describe('Generage static webpage assets')
  .option(
    '-c, --config',
    'Path to Steady config file that allows to modify default webpack configuration'
  )
  .action(({ config }) => {
    build(config);
  });

cli
  .command('create <project-directory>')
  .describe('Create Steady projet from template')
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

cli.parse(process.argv);
