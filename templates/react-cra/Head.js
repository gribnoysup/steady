import React from 'react';

import favicon from './assets/favicon.ico';

let Head = () => (
  <head>
    <meta charSet="utf-8" />
    <link rel="shortcut icon" href={favicon} />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <meta name="theme-color" content="#000000" />
    <title>Steady Document</title>
  </head>
);

export default Head;
