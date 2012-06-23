// init.js
// provide one-liner initialization of haraldops

// imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/util.html
var util = require('util')
// http://nodejs.org/docs/latest/api/child_process.html
var spawn = require('child_process').spawn

// exports
module.exports = merge(
	{
		init: init,
		createIdentifier: createIdentifier,
		browseTo: browseTo,
	},
	require('./mailsend'),
	require('./pingerlist'),
	require('./jsonloader'),
	require('./tee'),
	require('./init'),
	require('./logrequest'),
	require('./errorstack'),
	require('./ops')
)
exports = module.exports

var allowedChars = '0123456789abcdefghijklmnopqrstuvwxyz'
var ext = '.json'

var notCopiedProperties = [ 'appName', 'logger', 'path', 'noFile', 'identifier' ]

// opts
// .logger: logging function, eg. console.log
// .path: string or array of strings, eg. __dirname or __filename from calling script
// .appName: A human readable application name like 'Great Web site'
// identifier is derived from appname or the last part of the first path provided
// results: defaults.init.appName, defaults.init.identifier
function init(optsArg) {

	if (optsArg == null || typeof optsArg != 'object') optsArg = {}

	// init: appFolder tmpFolder homeFolder logger appName identifier
	var init = {}
	init.appFolder = exports.getAppFolder()
	init.tmpFolder = exports.getTmpFolder()
	init.homeFolder = exports.getHomeFolder()
	init.logger = typeof optsArg.logger == 'function' ? optsArg.logger : function () {}
	var appName
	if (optsArg.appName) {
		appName = optsArg.appName.valueOf()
		if (typeof appName != 'string') throw Error('appName property must be string')
	}
	if (!appName) {
		appName = path.basename(init.appFolder, path.extname(init.appFolder))
		if (!appName) throw Error('appName could not be determined')
	}
	init.appName = appName
	init.identifier = optsArg.identifier || createIdentifier(appName)

	// load json, add init field. May set init.defaultsFile
	var defaults = {}
	if (optsArg.noFile !== true) {
		defaults = exports.loadSettings(init.identifier, optsArg.path, init)
		if (defaults === false) defaults = {}
		else patchRegExp(defaults)
	}
	mergeMissing(defaults, removeProperties(optsArg, notCopiedProperties))
	defaults.init = init

	// execute configuration
	if (defaults.haraldops && defaults.haraldops.logFile) {
		exports.tee(defaults.haraldops)
	}
	init.logger(util.format('\n\n=== %s %s starting',
		getNow(),
		init.appName))
	if (defaults.haraldops) {
		if (!defaults.haraldops.identifier) defaults.haraldops.identifier = init.identifier
		if (defaults.haraldops.pingers || defaults.haraldops.responder) {
			defaults.init.ops = exports.opsconstructor(init.logger, defaults.haraldops)
		}
		if (defaults.haraldops.errorstack) exports.errorstack()
	}

	// PORT
	defaults.PORT = process.env.PORT || defaults.PORT || 3000

	return defaults
}

// appName: human readable application name string eg. 'Great App #3!!'
// return value: filesystem friendly application marker eg. 'greatapp3'
function createIdentifier(appName) {
	var result = ''
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

// return an object with the properties of all provided objects
function merge() {
	var result = {}
	for (index in arguments) {
		var obj = arguments[index]
		for (property in obj) {
			result[property] = obj[property]
		}
	}
	return result
}

// recreate object o without top-level properties in the string array properties
function removeProperties(o, properties) {
	var o1 = {}
	for (var property in o) {
		if (properties.indexOf(property) == -1) o1[property] = o[property]
	}
	return o1
}
// recursevly add properties from o1 to o that are not already present
function mergeMissing(o, o1) {
	merge(o, o1)

	function merge(o, o1) {
		for (var property in o1) {
			if (!o.hasOwnProperty(property)) o[property] = o1[property]
			else if (isObject(o[property]) && isObject(o1[property])) merge(o[property], o1[property])
		}
	}
}

// recursevly scan for strings in o, if the begin with 'regexp:' convert to RegExp
function patchRegExp(o) {
	patchProperties(o)

	function patchProperties(o) {
		if (isObject(o)) {
			for (var property in o) {
				var v = o[property]
				if (!isObject(v)) {
					if (isString(v) && v.substring(0, 7) == 'regexp:') {
						o[property] = new RegExp(v.substring(7, v.length).replace('/', '\\/'))
					}
				} else patchProperties(v)
			}
		}
	}
}

function isObject(o) {
	return o != null && typeof o.valueOf() == 'object'
}
function isString(s) {
	return s != null && typeof s.valueOf() == 'string'
}
function browseTo(url) {
	var cmd =
		process.platform == 'win32' ? 'explorer.exe' :
		process.platform == 'darwin' ? 'open' :
		'xdg-open'

	//console.log('spawn', cmd, [url])
	spawn(cmd, [url])
}