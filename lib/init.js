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

var allowedChars =	'0123456789abcdefghijklmnopqrstuvwxyz'
var ext = '.json'

// opts
// .logger: logging function, eg. console.log
// .path: __dirname or __filename from calling script
// .appName: A human readable application name like 'Great Web site'
// either path or appName must be provided
function init(optsArg) {

	// parse options
	var opts = {}
	if (typeof optsArg != 'object') optsArg = {}
	opts.logger = typeof optsArg.logger == 'function' ? optsArg.logger : function () {}
	if (typeof optsArg.path == 'string') opts.path = optsArg.path
	if (typeof optsArg.appName == 'string' && optsArg.appName) opts.appName = optsArg.appName
	if (!opts.path && !opts.appName) throw Error('haraldops.init: either path or application name must be provided')

	// determine opts.identifier
	opts.identifier = createIdentifier(opts.appName ||
		path.basename(opts.path, path.extname(opts.path)))
	if (!opts.appName) opts.appName = opts.identifier

	// determine opts.folder
	if (opts.path) {
		switch (getType(opts.path)) {
		case true: // it's a file
			opts.folder = path.dirname(opts.path)
			break
		case false: // it's a folder
			opts.folder = opts.path
		default:
			opts.folder = haraldops.getHomeFolder()
		}
	}

	// read our settings from either ~/AppMarker or scriptfolder/AppMarker
	var defaults = haraldops.defaults(opts.identifier, opts.folder)

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

	return defaults
}

// appName: human readable application name string eg. 'Great App #3!!'
// return value: filesystem friendly application marker eg. 'greatapp3'
function createIdentifier(appName) {
	var result = ''
	if (typeof appName != 'string') throw Error('Application name must be a string')
	appName = appName.toLowerCase()
	for (var index in appName) {
		var ch = appName.charAt(index)
		if (allowedChars.indexOf(ch) != -1) result += ch
	}
	if (result.length == 0) throw Error('AppMarker can not be empty string')
	return result
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

// yyyy-mm-dd hh:mm:ss local time
function getNow() {
	var myDate= new Date(Date.now() - 60000 * new Date().getTimezoneOffset()).toISOString()
	myDate = myDate.substring(0, 10) + ' ' + myDate.substring(11, 19)
	return myDate
}
