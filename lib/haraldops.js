// haraldops.js

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

module.exports = haraldutil.merge(
	require('./init'),
	{
		loadDefaultFile: require('./jsonloader').loadDefaultFile,
		loadSettings: require('./jsonloader').loadSettings,
	},
	require('./logrequest')
)