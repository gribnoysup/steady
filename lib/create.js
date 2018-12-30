let path = require('path');
let isValidPath = require('is-valid-path');
let fs = require('fs-extra');
let execa = require('execa');
let Git = require('simple-git/promise');
let semver = require('semver');
let validateName = require('validate-npm-package-name');
let paths = require('../config/paths');

let git = Git();

let createFromTemplate = (assetsMap, projectRoot) => {
  return Promise.all(
    assetsMap.map(source => {
      let [src, dest] = Array.isArray(source) ? source : [source, source];

      if (typeof src === 'string' && isValidPath(src)) {
        return fs.copy(
          path.join(paths.templates, src),
          path.join(projectRoot, dest)
        );
      } else if (typeof src === 'object' && src !== null) {
        return fs.writeJSON(path.join(projectRoot, dest), src);
      } else {
        return fs.writeFile(path.join(projectRoot, dest), src);
      }
    })
  );
};

let readTemplate = src => {
  return fs.readFile(path.join(paths.templates, src));
};

let npm = (...args) => execa('npm', ...args);

let create = async ({ template, projectDir, scriptsVersion, commit } = {}) => {
  projectDir = projectDir.trim();

  let projectRoot = path.resolve(process.cwd(), projectDir);
  let projectName = path.basename(projectRoot);
  let shortPath = projectRoot.replace(process.cwd(), '.');

  let { errors, warnings, validForNewPackages: validName } = validateName(
    projectName
  );

  if (validName === false) {
    let messages = [].concat(errors || [], warnings || []);
    console.error(`Can't create project with the name "${projectName}":`);
    messages.forEach(m => console.error(` - ${m}`));

    process.exitCode = 1;
    return;
  }

  let pkg = JSON.parse(await readTemplate('_package.json'));

  pkg.name = projectName;

  console.info('Creating project directory');

  await fs.mkdirp(projectRoot);

  let isGitAvailable = true;

  try {
    console.info('Initializing new git repository');

    await git.cwd(projectRoot);
    await git.init();

    let name = (await git.raw(['config', 'user.name'])).trim();
    let email = (await git.raw(['config', 'user.email'])).trim();

    if (name) {
      pkg.author = Object.assign(pkg.author || {}, { name });
    }

    if (email) {
      pkg.author = Object.assign(pkg.author || {}, { email });
    }
  } catch (error) {
    isGitAvailable = false;
    console.warn("Couldn't initialize git repo: first commit will be skipped");
  }

  try {
    console.info('Generating project files from template');

    await createFromTemplate(
      [
        [template, 'src'],
        ['_gitignore', '.gitignore'],
        [pkg, 'package.json'],
        'README.md',
      ],
      projectRoot
    );
  } catch (error) {
    console.error('Something went wrong while trying to bootstrap project:');
    console.error(error);

    process.exitCode = 1;
    return;
  }

  try {
    console.info('Installing project dependencies');

    let semverScriptsVersion = semver.valid(scriptsVersion);

    let devDeps =
      semverScriptsVersion !== null
        ? [`@steady/scripts@${semverScriptsVersion}`]
        : [scriptsVersion.trim()];

    // TODO: bind to template somehow
    let dependencies = ['react', 'react-dom'];

    await npm(['install', '--save-dev', '--save-exact', ...devDeps], {
      cwd: projectRoot,
    });

    await npm(['install', '--save', ...dependencies], { cwd: projectRoot });
  } catch (error) {
    console.error('Something went wrong while installing dependencies:');
    console.error(error);

    process.exitCode = 1;
    return;
  }

  if (isGitAvailable === true && commit === true) {
    try {
      console.info('Creating initial commit');

      await git.add('*');
      await git.commit('Initial commit (bootstrapped with steady-scripts) 🚀');
    } catch (error) {
      console.warn('Failed to create initial commit. Removing .git artifacts');

      try {
        await fs.remove(path.join(projectRoot, '.git'));
      } catch (error) {
        // Ignore
      }
    }
  }

  console.info('Done!');
};

module.exports = create;
