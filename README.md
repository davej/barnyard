Barnyard
========

[![npm version](https://badge.fury.io/js/barnyard.svg)](https://badge.fury.io/js/barnyard)
[![Build Status](https://travis-ci.org/davej/barnyard.svg?branch=master)](https://travis-ci.org/davej/barnyard)
[![Coverage Status](https://img.shields.io/coveralls/davej/barnyard.svg)](https://coveralls.io/r/davej/barnyard?branch=master)

Bootstrap/Scaffold a project for use with [Piggy in the Middle](https://github.com/davej/piggy-in-the-middle) and [Baconize](https://github.com/davej/baconize).


Getting Started
---------------

To install:
```sh
npm install barnyard
```

To scaffold out a project using `html`, `scss`, `babel`, you could do:

```javascript
var barnyard = require('barnyard');

var scaffoldDir = '/path/to/dir';
var options = {
  html: 'html',
  styles: 'scss',
  scripts: 'babel',
  whitespaceFormatting: 2,
  babelPolyfill: true,
  normalizeCss: true,
};

barnyard(scaffoldDir, options).then([successFn],[errorFn]);
// [successFn] will be passed an array of the files that were created during the scaffold
```

This will scaffold a project that has the following directory structure:

```
/path/to/dir
├─┬ scripts
│ ├── main.babel.js
│ └── polyfill.js
├─┬ styles
│ ├── main.scss
│ └── normalize.css
└ index.html
```

And here is a truncated version of the html file:

```html
<!DOCTYPE html>
  <head>
    <!-- ... -->
    <link rel="stylesheet" href="styles/normalize.css">
    <link rel="stylesheet" href="styles/main.css">
  </head>
  <body>
    <!-- ... -->
    <script src="scripts/polyfill.js"></script>
    <script src="scripts/main.js"></script>
  </body>
</html>
```


Options
-------

- **html** (String, default = 'html'): Which languages to use for html documents. Possibilities: 'html', 'jade'.

- **styles** (String, default = 'css'): Which languages to use for stylesheets. Possibilities: 'css', 'scss', 'sass', 'less', 'styl'.

- **scripts** (String, default = 'js'): Which languages to use for javascript. Possibilities: 'js', 'babel', 'coffee'.

- **babelPolyfill** (Boolean): Include and reference the [babel polyfill](https://babeljs.io/docs/usage/polyfill/).

- **normalizeCss** (Boolean): Include and reference [normalize.css](https://necolas.github.io/normalize.css/).

- **whitespaceFormatting** (Number, default = 'tabs'): Formatting for whitespace. If not specified then tabs will be used, otherwise you can pass a number (e.g. 2, 4, 8) and the corresponding number of spaces will be used
