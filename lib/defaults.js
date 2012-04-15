// getenv.js
// fetch provisioning for this location
module.exports = load

// http://nodejs.org/docs/latest/api/all.html

var fs = require('fs')

function load(appName, defaultFolder, ignoreHome) {
	 var result

	 var filename = appName + '.json'
	 if (!ignoreHome) result = loadJson(getHomeFolder() + '/' + filename)
	 if (!result && defaultFolder) result = loadJson(defaultFolder + '/' + filename)
	 if (!result) result = {}
	 return result
}

// try to load json from the specified path
function loadJson(path) {
	var result
	try {
		result = JSON.parse(fs.readFileSync(path))
	} catch (e) {
		var bad = true

		// ignore if file not found
		if (e instanceof Error  && e.code == 'ENOENT') bad = false

		if (bad) {
			// special message if syntax error in json
			var syntax = e instanceof SyntaxError
			if (syntax) e = SyntaxError('Bad syntax in property file:' + path + '\n' + e)

			throw(e)
		}
	}
	return result
}

function getHomeFolder() {
	return process.env[
		process.platform == 'win32' ?
		'USERPROFILE' :
		'HOME'];
}
