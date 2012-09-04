// test-init.js
// © Harald Rudell 2012

var init = require('../lib/init')
var jsonloader = require('../lib/jsonloader')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['MailOnly:'] = {
	'Test': function () {
		var initOpts = {
			haraldops: {
				mailsend: {
					user: 'sender@gmail.com',
					pass: 'password',
					to: 'recipient@gmail.com',
				},
			},
			noFile: true,
			logger: function () {},
		}
		var actual = init.init(initOpts)
//console.log(actual)
	},
}

exports['InitOverride:'] = {
	'Test': function () {
		var initOpts = {
			identifier: 'inittest',
			path: path.join(__dirname, 'data'),
			logger:log,
			property2: 'fromobj',
			property3: 'fromobj'
		}
		var filePath = path.join(initOpts.path, initOpts.identifier + '.json')
		var actual = init.init(initOpts)
	/*
	{ property1: 'fromfile',
	  property2: 'fromfile',
	  property3: 'fromobj',
	  init: 
	   { appFolder: '/home/foxyboy/Desktop/c505/node/haraldops',
	     tmpFolder: '/home/foxyboy/tmp',
	     homeFolder: '/home/foxyboy',
	     logger: [Function: log],
	     appName: 'haraldops',
	     identifier: 'inittest',
	     defaultsFile: '/home/foxyboy/Desktop/c505/node/haraldops/test/data/initassert.json' },
	  PORT: 3000 }
	*/
	//	console.log(actual)
		assert.equal(actual.property1, 'fromfile')
		assert.equal(actual.property2, 'fromfile')
		assert.equal(actual.property3, 'fromobj')
		assert.equal(actual.init.defaultsFile, filePath)

		function log() {}
	},
}

exports['MinimalInit:'] = {
	'Test': function () {
		var appName = 'X'
		var expected = {
			init: {
				appFolder: jsonloader.getAppFolder(),
				tmpFolder: jsonloader.getTmpFolder(),
				homeFolder: jsonloader.getHomeFolder(),
				logger: log,
				appName: appName,
				identifier: appName.toLowerCase(),
			},
			PORT: 3000,
		}
		var invocations = 0
		var actual = init.init({appName: 'X', noFile: true, logger:log})
	/*
	{ init: 
	   { appFolder: '/home/foxyboy/Desktop/c505/node/haraldops',
	     tmpFolder: '/home/foxyboy/tmp',
	     homeFolder: '/home/foxyboy',
	     logger: [Function: log],
	     appName: 'X',
	     identifier: 'x' },
	  PORT: 3000 }
	*/
	//	console.log(actual)

		assert.equal(invocations, 1, 'Log was not invoked exactly once')
		assert.deepEqual(actual, expected)

		function log() {
			invocations++
		}
	},
}

exports['CreateIdentifier'] = {
	'Test': function() {
		var expected = 'a'
		var actual = init.createIdentifier('#! a ')

		assert.equal(actual, expected, 'Creating identifier')
	},
}