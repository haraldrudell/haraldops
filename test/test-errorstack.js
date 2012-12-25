// test-errorstack.js
// © Harald Rudell 2012

var errorstack = require('../lib/errorstack')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var consoleGetter = getConsoleGetter()
var ce = console.error
var cw = console.warn
function getConsoleGetter() {
	var propertyDescriptor = Object.getOwnPropertyDescriptor(this, 'console')
	return propertyDescriptor.get
}
function setConsoleGetter(f) {
	__defineGetter__('console', f)
}

exports['ErrorStack:'] = {
	'console.error': function () {
		var aError = 0

		// errorstack redirects both .warn and .error to .error
		console.error = mockConsoleError
		errorstack.errorstack()
		console.error('e')
		setConsoleGetter(consoleGetter)
		console.error = ce
		console.warn = cw

		assert.equal(aError, 2)

		function mockConsoleError() {
			aError++
		}

	},
	'after': function () {
		setConsoleGetter(consoleGetter)
		console.error = ce
		console.warn = cw
	},
}