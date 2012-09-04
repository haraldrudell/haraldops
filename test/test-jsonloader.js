// test-jsonloader.js
// © Harald Rudell 2012

var jsonloader = require('../lib/jsonloader')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['LoadSettings:'] = {
	'Exact path file read': function () {
		var expected = {five: 5}
		var actual = jsonloader.loadSettings('ops', __dirname + '/data', true)
		assert.deepEqual(actual, expected, 'data/ops.json read incorrectly')
	},
	'Folder list file read': function () {
		var expected = {five: 5}
		var actual = jsonloader.loadSettings('ops', [ '/%^$', '/###', __dirname + '/data' ] , true)
		assert.deepEqual(actual, expected, 'data/ops.json read incorrectly')
	},
	'Nonexistent file': function () {
		// test a file that does not exist
		assert.throws(
			function () {
				jsonloader.loadSettings('ops-none', __dirname + '/data', true)
			},
			function (err) {
				assert.ok(err instanceof Error,
					'Reading a non-existent file does not throw exception'
					)
				return true
			})
	},
	'File with bad syntax': function () {
		var logger = function () {}
		assert.throws(function () {
			var result = jsonloader.loadSettings('opsbad', __dirname + '/data', true, logger)
		}, function (actual) {
			return actual instanceof Error
		})
	},
}

exports['GetOpts:'] = {
	'jsonLoader': function () {
		// check that object is created
		assert.deepEqual(jsonloader.getOpts(), {}, "getOpts did not produce empty object")

		// check default option
		var defaultOpts = { hey: 'hello' }
		assert.deepEqual(jsonloader.getOpts({}, defaultOpts), defaultOpts, "getOpts did not honor defaultOpts")
		// check mustHave
		var mustHave = [ 'hey' ]
		assert.deepEqual(jsonloader.getOpts({}, defaultOpts, mustHave), defaultOpts, "getOpts did not honor defaultOpts with mustHave")
		// check missing must have
		assert.throws(
			function () {
				jsonloader.getOpts(undefined, undefined, mustHave)
			}, function (err) {
				assert.ok(err instanceof Error, 'defaultOpts does not throw exception for missing mustHave')
				return true
			})
	},
}