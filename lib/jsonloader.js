// defaults.js
// fetch deployment data from json files

// imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

// exports
module.exports = {
	loadSettings: load,
	getOpts: getOpts,
	loadDefaultFile: loadDefaultFile,
	getHomeFolder: getHomeFolder,
	getTmpFolder: getTmpFolder,
	getType: getType,
	pushString: pushString,
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

	// add default folders
	if (!ignoreHome) {
		var home = haraldops.getHomeFolder()
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
		var type = getType(folder)
		if (type === false) {
			folder = path.join(folder, appNameFile)
			type = getType(folder)
		}
		if (type === true) {
			var value = loadJson(folder)
			if (value) {
				result = value
				loaded = true
			}
		}
		return loaded
	})) {
		// the file was not found anywhere
		throw Error('Could not find settings file named ' +
			appNameFilename +
			' in folders ' +
			folderArray.join(','))
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
		if (getType(folder !== false)) {
			folder = process.env.TEMP
			if (!folder || getType(folder !== false)) {
				folder = '/tmp'
				if (getType(folder !== false)) throw Error('no tmp folder found')
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

// create a populated options object
// optsArg: given options object
// mustHaves: array of optiuon names that must exist and be string value
// defaults: object with defaults added if missing
function getOpts(optsArg, defaultOpts, mustHaves, defaultFile) {

	// make sure we have an object
	var opts = (optsArg != null || typeof optsArg == 'object') ?
		optsArg : {}

	// add defaults
	for (var option in defaultOpts) {
		if (!opts.hasOwnProperty(option)) opts[option] = defaultOpts[option]
	}

	if (mustHaves) {
		// scan for missing must haves
		var theOption
		if (!mustHaves.every(function(option) {
			theOption = option
			var hasOption = false
			if (opts.hasOwnProperty(option)) {
				var value = opts[option]
				hasOption = value && typeof value == 'string'
			}
			return hasOption
		})) {
			// a mandatory option was missing
			// expception time!

			if (defaultFile == null) defaultFile = getHomeFolder() + '/haraldops.json'

			msg = 'Required options missing:' + theOption +
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
				+ '" with contents:\n' +
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

// determine what path1 is
// return value:
// undefined: does not exist
// false: is a directory
// true: is a file
function getType(path1) {
	var result
	var stats
	try {
		stats = fs.statSync(path1)
	} catch (e) {
		var bad = true
		if (e instanceof Error && e.code == 'ENOENT') bad = false
		if (bad) throw e
	}
	if (stats) {
		if (stats.isFile()) result = true
		if (stats.isDirectory()) result = false
	}
	return result
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

