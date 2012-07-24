// init.js
// provide one-liner initialization of haraldops

// imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/util.html
var util = require('util')
var jsonloader = require('./jsonloader')
var tee = require('./tee')
var errorstack = require('./errorstack')
var ops = require('./ops')
var mailsend = require('./mailsend')

// exports
module.exports = {
	init: init,
	createIdentifier: createIdentifier,
}

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
	init.appFolder = jsonloader.getAppFolder()
	init.tmpFolder = jsonloader.getTmpFolder()
	init.homeFolder = jsonloader.getHomeFolder()
	init.logger = typeof optsArg.logger == 'function' ? optsArg.logger : console.log
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
		var tempObject = {}
		defaults = jsonloader.loadSettings(init.identifier, optsArg.path, tempObject)
		if (tempObject.err) throw tempObject.err
		init.defaultsFile = tempObject.defaultsFile
		if (defaults === false) defaults = {}
		else patchRegExp(defaults)
	}
	mergeMissing(defaults, removeProperties(optsArg, notCopiedProperties))
	defaults.init = init

	// execute configuration
	if (defaults.haraldops && defaults.haraldops.logFile) {
		tee.tee(defaults.haraldops)
	}
	init.logger(util.format('\n\n=== %s %s starting',
		getNow(),
		init.appName))
	if (defaults.haraldops) {
		if (!defaults.haraldops.identifier) defaults.haraldops.identifier = init.identifier
		if (defaults.haraldops.pingers || defaults.haraldops.responder) {
			defaults.init.ops = ops.opsconstructor(init.logger, defaults.haraldops)
		} else if (defaults.haraldops.mailsend) {
			defaults.init.ops = mailsend.mailconstructor(init.logger, defaults.haraldops.mailsend)
		}
		if (defaults.haraldops.errorstack) errorstack.errorstack()
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