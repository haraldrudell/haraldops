// test-tee.js
// © Harald Rudell 2012

var tee = require('../lib/tee')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

// ops is tested in pingerlist
exports['Tee:'] = {
	'Tee': function () {
		//tee.tee() causes mochacoverage to hang
	},
	'MemWrite': function () {
		var a = {
			queue: [],
			memWrite: tee.memWrite,
		}

		a.memWrite(new Buffer('a'), true)
		a.memWrite('a', 'utf-8')
		assert.equal(a.queue.length, 2)
	},
	'after': function () {
		tee.unTee()
	},
}