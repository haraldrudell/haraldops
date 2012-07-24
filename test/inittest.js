// inittest.js
// test init.js

var init = require('../lib/init')
var jsonloader = require('../lib/jsonloader')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	testMinimalInit: testMinimalInit,
	testCreateIdentifier: testCreateIdentifier,
	testInitOverride: testInitOverride,
	testMailOnly: testMailOnly,
}

function testMailOnly(test) {
	var initOpts = {
		haraldops: {
			mailsend: {
				user: 'sender@gmail.com',
				pass: 'password',
				to: 'recipient@gmail.com',
			},
		},
		noFile: true,
	}
	var actual = init.init(initOpts)
	console.log(actual)
	test.done()
}

function testInitOverride(test) {
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
     defaultsFile: '/home/foxyboy/Desktop/c505/node/haraldops/test/data/inittest.json' },
  PORT: 3000 }
*/
//	console.log(actual)
	test.equal(actual.property1, 'fromfile')
	test.equal(actual.property2, 'fromfile')
	test.equal(actual.property3, 'fromobj')
	test.equal(actual.init.defaultsFile, filePath)
	test.done()

	function log() {}
}

function testMinimalInit(test) {
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

	haraldutil.doTest(test.equal, invocations, 1, 'Log was not invoked exactly once')
	test.deepEqual(actual, expected)
	test.done()

	function log() {
		invocations++
	}
}

function testCreateIdentifier(test) {
	var expected = 'a'
	var actual = init.createIdentifier('#! a ')

	haraldutil.doTest(test.equal, actual, expected, 'Creating identifier')
	test.done()
}