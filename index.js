'use strict';

var fs = require('fs');
var mark = require('markup-js');
var detab = require('detab');
var getDirName = require('path').dirname;
var Q = require('q');
var mkdirp = Q.denodeify(require('mkdirp'));
var readFile = Q.denodeify(fs.readFile);
var writeFile = Q.denodeify(fs.writeFile);

var templatesDir = 'templates/';
var stylesDir = 'styles/';
var scriptsDir = 'scripts/';

var fileMap = {
  html: {
    html: 'index.html',
    jade: 'index.jade',
  },
  styles: {
    css: stylesDir + 'main.css',
    less: stylesDir + 'main.less',
    sass: stylesDir + 'main.sass',
    scss: stylesDir + 'main.scss',
    styl: stylesDir + 'main.styl',
  },
  scripts: {
    js: scriptsDir + 'main.js',
    babel: scriptsDir + 'main.babel.js',
    coffee: scriptsDir + 'main.coffee',
    ts: scriptsDir + 'main.ts'
  },
  babelPolyfill: 'babel-polyfill/dist/polyfill.js',
  normalizeCss: 'normalize.css/normalize.css',
};

/**
 * Barnyard - Bootstrap/Scaffold a project for use with Piggy in the Middle and Baconize
 * @param  {string} projectDir Directory to scaffold the generated project to
 * @param  {Object} options    {
 *                               html: 'html', // Languages to use for html: 'html', 'jade'
 *                               styles: 'css', // Languages to use for styles: 'css', 'scss', 'sass', 'less', 'styl'
 *                               scripts: 'js', // Languages to use for scripts: 'js', 'babel', 'coffee'
 *                               babelPolyfill: undefined, // Boolean
 *                               normalizeCss: undefined, // Boolean,
 *                               whitespaceFormatting: 'tabs', // Pass in a number (e.g. 2) to use spaces for whitespace, otherwise tabs will be used
 *                             }
 * @return {Promise<Array[string]>}            Files created during scaffolding
 */
module.exports = function barnyard(projectDir, options) {
  options = typeof options === 'object' ? options : {};
  options.html = options.html || 'html';
  options.styles = options.styles || 'css';
  options.scripts = options.scripts || 'js';

  function formatOutputObject(inputFile, outputFilename, requiresTemplating) {
    return inputFile.then(function(data) {
      if (requiresTemplating) {
        data = mark.up(data, options);
      }
      if (typeof options.whitespaceFormatting === 'number') {
        data = detab(data, options.whitespaceFormatting);
      }
      return {
        data: data,
        path: outputFilename
      };
    });
  }

  function copyModuleFileAs(modulePath, outputPath) {
    var filename = require.resolve(modulePath);
    var inputFile = readFile(filename, 'utf8');
    return formatOutputObject(inputFile, outputPath);
  }

  function getTemplateFile(filename, requiresTemplating) {
    var inputFile = readFile(templatesDir + filename, 'utf8');
    return formatOutputObject(inputFile, filename, requiresTemplating);
  }

  function prepareHtml() {
    var htmlLang = options.html;
    var filename = fileMap.html[htmlLang];
    return getTemplateFile(filename, true); // HTML files require templating through marked.js
  }

  function prepareStyles() {
    var cssLang = options.styles;
    var filename = fileMap.styles[cssLang];
    return getTemplateFile(filename);
  }

  function prepareScripts() {
    var scriptsLang = options.scripts;
    var filename = fileMap.scripts[scriptsLang];
    return getTemplateFile(filename);
  }

  function prepareFiles() {
    var files = [];
    files.push(prepareHtml());
    files.push(prepareStyles());
    files.push(prepareScripts());
    if (options.babelPolyfill) {
      files.push(copyModuleFileAs(fileMap.babelPolyfill, scriptsDir + 'polyfill.js'));
    }
    if (options.normalizeCss) {
      files.push(copyModuleFileAs(fileMap.normalizeCss, stylesDir + 'normalize.css'));
    }

    return Q.all(files);
  }

  function outputFile(path, data) {
    return mkdirp(getDirName(path)).then(function() {
      return writeFile(path, data).then(function() {
        return path;
      });
    });
  }

  function outputFiles(files) {
    var outputFilesList = files.map(function(file) {
      var filePath = projectDir + file.path;
      return outputFile(filePath, file.data);
    });
    return Q.all(outputFilesList);
  }

  return prepareFiles().then(outputFiles);
};
