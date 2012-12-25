// test-logrequest.js
// © Harald Rudell 2012

var logrequest = require('../lib/logrequest')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['LogRequest:'] = {
	'Init': function (done) {
		var ignoreTheseUris = ['z']
		var req1 = {url: 'URL'}
		var req2 = {url: ignoreTheseUris[0]}
		var aLog = 0

		var actual = logrequest.logrequest(mockLog, ignoreTheseUris)
		assert.equal(typeof actual, 'function')

		actual(req1, {}, next1)

		function next1() {
			assert.equal(aLog, 1)
			actual(req2, {}, next2)
		}

		function next2() {
			assert.equal(aLog, 1)

			done()
		}

		function mockLog() {
			aLog++
		}
	},
	'NonArray': function (done) {
		var ignoreTheseUris = /z/
		var req1 = {url: 'URL'}
		var aLog = 0

		var actual = logrequest.logrequest(mockLog, ignoreTheseUris)
		actual(req1, {}, next)

		function next() {
			assert.equal(aLog, 1)

			done()
		}
		function mockLog() {
			aLog++
		}
	},
}