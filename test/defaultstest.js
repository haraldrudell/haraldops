// defaultstest.js
// unit test for defaults.js
// https://github.com/caolan/nodeunit
// http://nodejs.org/docs/latest/api/all.html

var defaults = require('../lib/defaults')

exports.testDefaults = testDefaults

function testDefaults(test) {

	// test a file that works
	var expected = { five: 5 }
	var actual = defaults('ops', __dirname + '/data', true)
	test.deepEqual(actual, expected, 'data/ops.json read incorrectly')

	// test a file that does not exist
	var empty = {}
	var actual = defaults('ops-none', __dirname + '/data', true)
	test.deepEqual(actual, empty, 'Reading a non-existent file failed')

	// test bad json
	test.throws(
		function () {
			var actual = defaults('opsbad', __dirname + '/data', true)
		},
		function(err) {
			var result = err instanceof SyntaxError
			if (!result) console.log('Not the expected exception')
			return result
		})

	test.done()
}
