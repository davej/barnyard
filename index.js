'use strict';

var fs = require('fs');
var mark = require('markup-js');
var detab = require('detab');
var path = require('path');
var getDirName = path.dirname;
var join = path.join;
var deepAssign = require('deep-extend');
var Q = require('q');
var mkdirp = Q.denodeify(require('mkdirp'));
var readFile = Q.denodeify(fs.readFile);
var writeFile = Q.denodeify(fs.writeFile);

var templatesDir = 'templates';

var defaults = {
  html: {
    file: 'index',
    type: 'html', // or 'jade'
  },
  styles: {
    folder: 'styles',
    file: 'main',
    type: 'css', // or 'scss', 'sass', 'less', 'styl'
  },
  scripts: {
    folder: 'scripts',
    file: 'main',
    type: 'js', // or 'babel', 'coffee'
  },
  babelPolyfill: false,
  normalizeCss: false,
  whitespaceFormatting: 'tabs',
}

var fileMap = {
  html: {
    html: function(name) { return (name || defaults.html.file) + '.html' },
    jade: function(name) { return (name || defaults.html.file) + '.jade' },
  },
  styles: {
    css: function(name, dir) {
      return join((dir || defaults.styles.folder), (name || defaults.styles.file) + '.css');
    },
    less: function(name, dir) {
      return join((dir || defaults.styles.folder), (name || defaults.styles.file) + '.less');
    },
    sass: function(name, dir) {
      return join((dir || defaults.styles.folder), (name || defaults.styles.file) + '.sass');
    },
    scss: function(name, dir) {
      return join((dir || defaults.styles.folder), (name || defaults.styles.file) + '.scss');
    },
    styl: function(name, dir) {
      return join((dir || defaults.styles.folder), (name || defaults.styles.file) + '.styl');
    },
  },
  scripts: {
    js: function(name, dir) {
      return join((dir || defaults.scripts.folder), (name || defaults.scripts.file) + '.js')
    },
    babel: function(name, dir) {
      return join((dir || defaults.scripts.folder), (name || defaults.scripts.file) + '.babel.js')
    },
    coffee: function(name, dir) {
      return join((dir || defaults.scripts.folder), (name || defaults.scripts.file) + '.coffee')
    },
    ts: function(name, dir) {
      return join((dir || defaults.scripts.folder), (name || defaults.scripts.file) + '.ts')
    },
  },
  babelPolyfill: 'babel-polyfill/dist/polyfill.js',
  normalizeCss: 'normalize.css/normalize.css',
};

/**
 * Barnyard - Bootstrap/Scaffold a project for use with Piggy in the Middle and Baconize
 * @param  {string} projectDir Directory to scaffold the generated project to
 * @param  {Object} options
 *     {
 *       html: {
 *         file: 'index',
 *         type: 'html', // or 'jade'
 *       },
 *       styles: {
 *         folder: 'styles',
 *         file: 'main',
 *         type: 'css', // or 'scss', 'sass', 'less', 'styl'
 *       },
 *       scripts: {
 *         folder: 'scripts',
 *         file: 'main',
 *         type: 'js', // or 'babel', 'coffee'
 *       },
 *      babelPolyfill: true/false, // include babel polyfill?
 *      normalizeCss: true/false, // include CSS normalizer file?
 *      whitespaceFormatting: 'tabs', // Pass in a number (e.g. 2) to use spaces for whitespace, otherwise tabs will be used
 *    }
 *
 * @return {Promise<Array[string]>}            Files created during scaffolding
 */
module.exports = function barnyard(projectDir, options) {
  options = deepAssign({}, defaults, options);

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

  function getTemplateFile(inputFilename, outputFilename, requiresTemplating) {
    var inputFile = readFile(join(templatesDir, inputFilename), 'utf8');
    return formatOutputObject(inputFile, outputFilename, requiresTemplating);
  }

  function prepareHtml() {
    var htmlLang = options.html.type;
    var inputFilename = fileMap.html[htmlLang]();
    var outputFilename = fileMap.html[htmlLang](options.html.file);
    // HTML files require templating through marked.js so add `true` param
    return getTemplateFile(inputFilename, outputFilename, true);
  }

  function prepareStyles() {
    var cssLang = options.styles.type;
    var inputFilename = fileMap.styles[cssLang]();
    var outputFilename = fileMap.styles[cssLang](options.styles.file, options.styles.folder);
    return getTemplateFile(inputFilename, outputFilename);
  }

  function prepareScripts() {
    var scriptsLang = options.scripts.type;
    var inputFilename = fileMap.scripts[scriptsLang]();
    var outputFilename = fileMap.scripts[scriptsLang](options.scripts.file, options.scripts.folder);
    return getTemplateFile(inputFilename, outputFilename);
  }

  function prepareFiles() {
    var files = [];
    files.push(prepareHtml());
    files.push(prepareStyles());
    files.push(prepareScripts());
    if (options.babelPolyfill) {
      files.push(copyModuleFileAs(fileMap.babelPolyfill, join(options.scripts.folder, 'polyfill.js')));
    }
    if (options.normalizeCss) {
      files.push(copyModuleFileAs(fileMap.normalizeCss, join(options.styles.folder, 'normalize.css')));
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
