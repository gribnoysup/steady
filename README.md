# Steady

Steady generates completely static web pages from your React code

## DISCLAIMER

This project is still very much work in progress and is made to solve my
specific use case. Use at your own risk!

## What Is Steady?

Steady is static webpage generator for your React application. Sometimes all you
want to send to your webpage visitors over the wire is just some HTML and CSS,
but it would be nice to generate it using modern bundling tools that allow quick
iteration over your work and apply automated optimizations to what you built.

When building a webpage with Steady, you are writing code with React framework
and can use any js dependencies of your choice. Want to use `date-fns` for date
formatting? Sure! Want your favourite flavour of `css-in-js`? Why not!

Just keep in mind one thing: when you bundle your webpage with `build` command,
your JavaScript bundle is not "emitted" by Webpack and not included on the page.
You are building a React application, but it will be executed only on server to
generate initial page layout with `ReactDOMServer.renderToStaticMarkup`.

## Why Not Some Other React Static Generator?

All React webpage generators that I saw in the wild are still including
JavaScript on the page. The goal of Steady is to generate pages with almost zero
JavaScript and definitely to avoid sending React/ReactDOM itself to the client.

## What Is Included?

Most of the Webpack config is almost the same as Create React App Webpack
configuration, so things that are supported in CRA, should work in Steady also

There are two additional features added to Steady by default:

- `responsive-loader` to generate resized versions on the images for srcset
  image attribute
- `critters-webpack-plugin` to extract and inline critical CSS right on the page

## How it works?

There is one predefined Webpack config that produces all the assets, using
`src/index.js` as a main entry point. When the assets are produced, special
[`PrerenderHtmlWebpackPlugin`](https://github.com/gribnoysup/steady-scripts/blob/master/lib/PrerenderHTMLWebpackPlugin.js)
plugin in combination with `HtmlWebpackPlugin` is used to evaluate main
JavaScript chunk and render it to string using
[default renderer](https://github.com/gribnoysup/steady-scripts/blob/081dddcbc5f6e0db6c27c3f34aa0550fe907c7ff/lib/renderer.js#L2).
After HTML is generated, all files, except JavaScript, are emitted.

In the dev mode it is the same procedure, but BrowsersyncPluginWebpack is used
to serve the dist folder, providing live reload features.

## Overriding Defaults

### Changing Render Method with `_render.js`

As mentioned above, by default Steady will render your webpacge with React
renderer. You can change this behaviour by providing your own render method. To
do this, create `src/_render.js` file. This module should export async function
that will get HtmlWebpackPlugin data as first argument and should return a
string of rendered markup:

```jsx
// file: src/_render.js

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fetch from 'node-fetch';

import Document from './index.js';

export default async htmlPluginData => {
  let response = await fetch('data-from-api.json');
  let data = await response.json();

  return ReactDOMServer.renderToStaticMarkup(
    <Document data={data} htmlPluginData={htmlPluginData} />
  );
};
```

### `--config` Option And Steady Config

TODO

## Steady CLI

### `steady create`

Creates Steady project in `<project-directory>` from template. Available
templates are `react-cra` and `react-minimal`, default template is `react-cra`

#### Usage

```sh
npx @steady/scripts create <project-directory> [options]
```

#### Options

| Option                | Description                                        | Default                    |
| --------------------- | -------------------------------------------------- | -------------------------- |
| -t, --template        | Template that will be used to generate the project | `"react-cra"`              |
| -s, --scripts-version | Custom Steady scripts version                      | `"@steady/scripts@latest"` |
| -c, --commit          | Create initial commit (use --no-commit to disable) | `true`                     |

#### Example

```sh
npx @steady/scripts ./my-awesome-project --template react-minimal
```

### `steady start`

Starts dev server for a Steady project. Will be provided as npm start command by
default in any project created with Steady `create` command

#### Usage

```sh
npx @steady/scripts start [options]
```

#### Options

| Option       | Description                                                                    | Default |
| ------------ | ------------------------------------------------------------------------------ | ------- |
| -c, --config | Path to Steady config file that allows to modify default webpack configuration | –       |

#### Example

```sh
npx @steady/scripts start -c steady.config.js
```

### `steady build`

Generates productin-ready web page assets in the `dist` folder

#### Usage

```sh
npx @steady/scripts build [options]
```

#### Options

| Option       | Description                                                                    | Default |
| ------------ | ------------------------------------------------------------------------------ | ------- |
| -c, --config | Path to Steady config file that allows to modify default webpack configuration | –       |

#### Example

```sh
npx @steady/scripts build -c steady.config.js
```

## TODO

- [ ] babel macro for small script tag injections to support binding events to
      DOM to an extent
- [ ] more CRA2 features: typescript, opt-in scss
- [ ] create command to generate initial application structure
- [ ] multiple routes support
- [ ] better docs

## LICENSE

ISC
