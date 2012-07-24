// defaults.js
// fetch deployment data from json files

// imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

// exports
module.exports = {
	loadSettings: load,
	getOpts: getOpts,
	loadDefaultFile: loadDefaultFile,
	getHomeFolder: getHomeFolder,
	getTmpFolder: getTmpFolder,
	pushString: pushString,
	getAppFolder: getAppFolder,
}

// class variables
var defaultBasename = 'settings'
var defaultExtension = '.json'
var defaultHomeSubfolder = 'apps'
var cachedTmpFolder

// attempt to load json settings
// throws exception if no file is found, or if a file has json syntax errors
//
// appName: default filename, may contain path and extension
// default extension: .json
//
// defaultFolder: single folder or array of folders, no terminating slash
// if appname has path, this folder is searched first
// if ignoreHome is not true, the home/apps and home folder is searched second
// finally any path given in defaultFolder is searched
//
// ignoreHome: do not search in user's home folder
function load(appName, defaultFolder, ignoreHome) {
	 var result

	 // get the array of folders to scan
	var folderArray = []
	var good = true
	if (Array.isArray(defaultFolder)) {
		good = defaultFolder.every(function (path) {
			return pushString(folderArray, path)
		})
	} else {
		if (defaultFolder) good = pushString(folderArray, defaultFolder)
	}
	if (!good) throw Error('defaultFolder must be string or array of strings')
	if (folderArray.length == 0) folderArray.push(getAppFolder())

	// add default folders
	if (ignoreHome !== true && typeof ignoreHome != 'object') {
		var home = getHomeFolder()
		folderArray.unshift(home)
		folderArray.unshift(path.join(home, defaultHomeSubfolder))
	}

	 // parse AppName into filename with extension and folder
	var appNameFolder = path.dirname(appName)
	var hasPath =  appNameFolder != '.'
	if (hasPath) {
		// make into absolute path
		appNameFolder = path.resolve(appNameFolder)
		folderArray.unshift(appNameFolder)
	}
	var appNameFile = hasPath ? path.basename(appName) : appName
	var hasExtension = path.extname(appNameFile).length != 0
	if (!hasExtension) appNameFile += defaultExtension

	// try to load json using appNameFile and folderArray
	if (!folderArray.some(function(folder) {
		// return true if json could be loaded
		var loaded = false
		var type = haraldutil.getType(folder)
		if (type === false) {
			folder = path.join(folder, appNameFile)
			type = haraldutil.getType(folder)
		}
		if (type === true) {
			var value = loadJson(folder)
			if (value) {
				if (typeof ignoreHome == 'object') ignoreHome.defaultsFile = folder
				result = value
				loaded = true
			}
		}
		return loaded
	})) {
		// the file was not found anywhere
		var err = Error('Could not find settings file named ' +
			appNameFile +
			' in folders ' +
			folderArray.join(','))
		if (typeof ignoreHome == 'object') ignoreHome.err = err
		else throw err
	}

	 return result
}

// try to load json from the specified path
// throws exception on syntax problem in a found file
// return value: object or false if file was not found
function loadJson(path) {
	var result = false
	try {
		result = JSON.parse(fs.readFileSync(path))
	} catch (e) {
		var bad = true

		// ignore if file not found
		if (e instanceof Error  && e.code == 'ENOENT') bad = false

		if (bad) {
			// special message if syntax error in json
			var syntax = e instanceof SyntaxError
			if (syntax) e = SyntaxError('Bad syntax in property file:' + path + '\n' + e)

			throw(e)
		}
	}
	return result
}

// get path to a temporary folder like '/tmp'
// throws ecception if not found
function getTmpFolder() {
	var folder = cachedTmpFolder
	if (!folder) {
		folder = path.join(getHomeFolder(), 'tmp')
		if (haraldutil.getType(folder) !== false) {
			folder = process.env.TEMP
			if (!folder || getType(folder) !== false) {
				folder = '/tmp'
				if (getType(folder) !== false) throw Error('no tmp folder found')
			}
		}
		cachedTmpFolder = folder
	}
	return folder
}

// get home folder like "/home/user"
function getHomeFolder() {
	return process.env[
		process.platform == 'win32' ?
		'USERPROFILE' :
		'HOME']
}

// get ap Folder
function getAppFolder() {
	var i = __dirname.indexOf('node_modules')
	if (i == -1) i = __dirname.indexOf('lib')
	if (i == -1) i = __dirname.length + 1
	return __dirname.substring(0, i - 1)
}

// create a populated options object
// optsArg: given options object
// mustHaves: array of optiuon names that must exist and be string value
// defaults: object with defaults added if missing
function getOpts(optsArg, defaultOpts, mustHaves, defaultFile) {

	// make sure we have an object
	var opts = {}

	// add provided options
	if (optsArg != null || typeof optsArg == 'object') {
		for (var property in optsArg) {
			opts[property] = optsArg[property]
		}
	}

	// add missing defaultedd options
	for (var option in defaultOpts) {
		if (!opts.hasOwnProperty(option)) opts[option] = defaultOpts[option]
	}

	if (mustHaves) {
		// scan for missing must haves
		var lastTestedOption
		if (!mustHaves.every(function(option) {
			lastTestedOption = option
			var hasOption = false
			if (opts.hasOwnProperty(option)) {
				var value = opts[option]
				hasOption = value != null && typeof value.valueOf() == 'string'
			}
			return hasOption
		})) {
			// a mandatory option was missing
			// expception time!

			if (defaultFile == null) defaultFile = getHomeFolder() + '/haraldops.json'

			msg = 'Required options missing:' + lastTestedOption +
				'\nUnable to start.\n'

			if (defaultFile) {
				// outline json file content
				var content = '{'
				var first = true
				mustHaves.forEach(function(option) {
					if (first) first = false
					else content += ','
					content += '\n\t' + option + ': "<value here>"'
				})
				content += '\n}'

				msg += 'Options could be stored in a file "' +
				defaultFile +
				'" with contents:\n' +
				content
			}
			throw(Error(msg))
		}
	}

	return opts
}

// read default options. throws exception if bad syntax
function loadDefaultFile() {
	var obj = load(getHomeFolder() + '/haraldops.json')
	return obj || {}
}

// add value to array arr if value is string
// return value: true if value was string
function pushString(arr, value) {
	var innerValue = value && value.valueOf()
	var result = typeof innerValue == 'string'
	if (result) {
		arr.push(innerValue)
	}
	return result
}