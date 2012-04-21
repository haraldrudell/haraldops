// defaults.js
// fetch deployment data from json files

// imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

// exports
module.exports = load
module.exports.getOpts = getOpts
module.exports.loadDefaultFile = loadDefaultFile
module.exports.getHomeFolder = getHomeFolder

// class variables
var defaultBasename = 'settings'
var defaultExtension = '.json'

// attempt to load json settings
// throws exception if no file is found, or if a file has json syntax errors
//
// folders:
// if appname has path, this folder is searched first
// if ignoreHome is not true, the home folder is searched second
// finally any path given in defaultFolder is searched
//
// appname: the base name of the app, default settings
// -- if extension is missing, .json is added
// if it contains a path, this is the first folder used
// defaultFolder: single folder or array of folders, no terminating slash
// ignoreHome: do not search in user's home folder
function load(appName, defaultFolder, ignoreHome) {
	 var result

	 // get the array of folders to scan
	 var folderArray = []
	 if (Array.isArray(defaultFolder)) folderArray = defaultFolder
	 else {
	 	if (defaultFolder != null && typeof defaultFolder == 'string') folderArray.push(defaultFolder)
	 }
	if (!ignoreHome) folderArray.splice(0, 0, getHomeFolder())

	 // parse AppName into filename and folder
	 // add default extension
	 // save possible folder
	 var appNameFilename = defaultBasename + defaultExtension
	 var appNameFolder
	 if (appName != null || typeof appName == 'string') {
	 	var slash = appName.lastIndexOf('/')
	 	if (slash != -1) {
	 		folderArray.splice(0, 0, appName.substring(0, slash))
	 	}
	 	appNameFilename = appName.substring(slash + 1, appName.length)
	}
	var dot = appNameFilename.lastIndexOf('.')
	if (dot == -1) appNameFilename += defaultExtension

	// try to load json using appNameFilename and folderArray
	if (!folderArray.some(function(folder) {
		// return true if json could be loaded
		var value = loadJson(folder + '/' + appNameFilename)
		if (value) result = value
		return value
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
