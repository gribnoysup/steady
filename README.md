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

## Overriding Defaults

### Changing Render Method with `_render.js`

TODO

### `--config` Option And Steady Config

TODO

## Steady CLI

### `steady create`

TODO

### `steady start`

TODO

### `steady build`

Generates productin-ready web page assets

## TODO

- [ ] babel macro for small script tag injections to support binding events to
      DOM to an extent
- [ ] more CRA2 features: typescript, opt-in scss
- [ ] create command to generate initial application structure
- [ ] multiple routes support
- [ ] better docs

## LICENSE

ISC
