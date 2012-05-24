// init.js
// provide one-liner initialization of haraldops

// imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/haraldops
var haraldops = require('./ops')
// http://nodejs.org/docs/latest/api/util.html
var util = require('util')

// exports
module.exports.init = init

var allowedChars = '0123456789abcdefghijklmnopqrstuvwxyz'
var ext = '.json'

// opts
// .logger: logging function, eg. console.log
// .path: string or array of strings, eg. __dirname or __filename from calling script
// .appName: A human readable application name like 'Great Web site'
// identifier is derived from appname or the last part of the first path provided
// results: defaults.init.appName, defaults.init.identifier
function init(optsArg) {

	// parse options
	var opts = {}
	if (typeof optsArg != 'object') optsArg = {}

	// determine logger
	opts.logger = typeof optsArg.logger == 'function' ? optsArg.logger : function () {}

	// assemble paths to an array of strings
	opts.paths = []
	var good = true
	if (Array.isArray(optsArg.path)) good = optsArg.path.every(function (path) {
		return pushString(opts.paths, path)
	}) else if (optsArg.path) good = pushString(opts.paths, optsArg.path)
	if (!good) throw Error('opts.path must be string or array of strings')

	// get appName
	var name
	if (optsArg.appName) {
		name = optsArg.valueOf()
		if (typeof name != 'string') throw Error('opts.appName must be string')
	}
	if (!name) {
		if (!opts.paths.length) throw Error('either opts.appName or opts.path must be provided')
		name = path.basename(opts.path[0], path.extname(opts.path[0]))
		if (!name) throw Error('appName could not be determined')
	}
	opts.appName = name

	// determine opts.identifier
	opts.identifier = createIdentifier(name)

	// read our settings from either ~/AppMarker or scriptfolder/AppMarker
	var defaults = haraldops.defaults(opts.identifier, opts.folder)

	opts.tmpFolder = ops.getTmpFolder()

	// save our data
	defaults.init = opts

	// execute configuration
	if (defaults.haraldops &&
		defaults.haraldops.logFile) {
		haraldops.tee(defaults.haraldops)
	}
	opts.logger(util.format('\n\n=== %s %s starting',
		getNow(),
		opts.appName))
	if (defaults.haraldops &&
		(defaults.haraldops.pingers ||
			defaults.haraldops.responder)) {
		defaults.init.ops = haraldops.opsconstructor(opts.logger, defaults.haraldops)
	}
	if (defaults.errorstack) haraldops.errorstack()

	// PORT
	if (process.env.PORT) defaults.PORT = process.env.PORT
	if (!defaults.PORT) defaults.PORT = 3000

	// convert 'regex:...' to regexp
	if (Array.isArray(defaults.ignoreUris))
		defaults.ignoreUris.forEach(function (uri, index, arr) {
			if (uri.substring(0, 7) == 'regexp:') {
				arr[index] = new RegExp(uri.substring(7, uri.length).replace('/', '\\/'))
			}
		})

	return defaults

}

// appName: human readable application name string eg. 'Great App #3!!'
// return value: filesystem friendly application marker eg. 'greatapp3'
function createIdentifier(appName) {
	appName = appName.toLowerCase()
	for (var index in appName) {
		var ch = appName.charAt(index)
		if (allowedChars.indexOf(ch) != -1) result += ch
	}
	if (result.length == 0) throw Error('AppMarker can not be empty string')
	return result
}

// yyyy-mm-dd hh:mm:ss local time
function getNow() {
	var myDate= new Date(Date.now() - 60000 * new Date().getTimezoneOffset()).toISOString()
	myDate = myDate.substring(0, 10) + ' ' + myDate.substring(11, 19)
	return myDate
}
