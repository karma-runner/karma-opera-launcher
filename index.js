var fs = require('fs')
var path = require('path')

var PREFS = fs.readFileSync('./config/prefs.ini')

var OperaBrowser = function (baseBrowserDecorator) {
  baseBrowserDecorator(this)

  this._getOptions = function (url) {
    // Opera CLI options
    // http://www.opera.com/docs/switches/
    return [
      '-pd', this._tempDir,
      '-nomail',
      url
    ]
  }

  this._start = function (url) {
    var self = this

    var prefsFile = this._tempDir + '/operaprefs.ini'
    fs.writeFile(prefsFile, PREFS, function (err) {
      if (err) {
        console.error('Can not write perferences files')
        console.error(err)
      }
      self._execCommand(self._getCommand(), self._getOptions(url))
    })
  }
}

var findWindowsOperaExecutable = function () {
  // First we need the directory where Opera is installed.
  var operaPath

  var defaultPaths = [
    process.env['ProgramFiles'],
    process.env['ProgramFiles(X86)']
  ]

  var executable = null
  var found = defaultPaths.some(function (progFiles) {
    var oP = path.join(progFiles, 'Opera')
    try {
      fs.statSync(oP)
      operaPath = oP
      return true
    } catch (e) {
      return false
    }
  })

  if (!found) {
    return null
  }

  // Check if there is an opera.exe
  try {
    executable = path.join(operaPath, 'opera.exe')
    fs.statSync(executable)
    return executable
  } catch (e) {}

  // If not, check the directories inside Opera; the directory structure is, for example,
  // Opera
  // + 20.0.1750.51
  //   + opera.exe
  // i.e. opera is in a versioned directory, so we have to scan them.
  found = fs.readdirSync(operaPath)
    .map(function (name) {
      return path.join(operaPath, name)
    })
    .filter(function (name) {
      return fs.statSync(name).isDirectory()
    })
    .sort()
    .some(function (dir) {
      executable = path.join(dir, 'opera.exe')

      try {
        if (fs.statSync(executable).isFile()) {
          return true
        }
      } catch (e) {
        // console.log('Not found')
      }
    })

  if (found) {
    // Weeee!
    return executable
  }

  return null

}

OperaBrowser.prototype = {
  name: 'Opera',

  DEFAULT_CMD: {
    linux: 'opera',
    darwin: '/Applications/Opera.app/Contents/MacOS/Opera',
    win32: findWindowsOperaExecutable()
  },
  ENV_CMD: 'OPERA_BIN'
}

OperaBrowser.$inject = ['baseBrowserDecorator']

// PUBLISH DI MODULE
module.exports = {
  'launcher:Opera': ['type', OperaBrowser]
}
