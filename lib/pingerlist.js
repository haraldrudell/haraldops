// pingerlist.js
// maintains status of all registered pingers

module.exports = constructor

// maintain the status of pingers that this server is monitoring
// maxAge: the maximum age of now timestamp
// idetifier: the app identifier returned for responder
// (affected by other server's clock inaccuracy and response time)
function constructor(identifier, maxAge) {
	// key: title of pinger
	// value : { period: second, last: unix timestamp }
	var pingerlist = {}
	if (typeof identifier != 'string') throw('opsconstructor: string identifier required')
	if (!maxAge) maxAge = 60

	return {
		addPinger: addPinger,
		getResponderString: getResponderString,
		updateSuccess: updateSuccess,
		checkResponse: checkResponse,
	}

	// save a new pinger
	function addPinger(title, period) {
		pingerlist[title] = {period: period, last: unixTimestampNow() }
	}

	// update last field for a test that just succeeded
	function updateSuccess(title) {
		pingerlist[title].last = unixTimestampNow()
	}

	// provide a status string for another server requesting it
	// result: string that can be sent over the web
	function getResponderString() {
		var object = pingerlist
		object[identifier] = unixTimestampNow()
		var string = JSON.stringify(object)
		return string
	}

	// we have pinged another pingerList server and got a response
	// check that the returned status string is ok
	// title: porintable string eg. 'Home Server'
	// string: the response body, should be text-json
	// app: the expected app eg. 'nodejs3'
	// return value: null: object and all checks are ok
	// otherwise: printable issue string
	function checkResponse(title, string, app) {
		var result

		// convert response body json string to an object
		var object
		if (string != null && typeof string.valueOf() == 'string') {
			try {
				object = JSON.parse(string)
			} catch (e) { // ignore SyntaxError
			}
		}
		if (!object) {
			result = 'Response format not json'

		// check for expected deployed app identifier
		} else if (!object.hasOwnProperty(app)) {
			result = 'Unmatched app name:' + app
		} else {

			// check age of the response
			var timestamp = object[app]
			var now = unixTimestampNow()
			if (typeof timestamp != 'number' ||
				now - timestamp > maxAge) {
				result = 'response timestamp old or corrupt'
			} else {

				// examine each pingresult entry
				for (var pingerTitle in object) {
					if (pingerTitle != app) {
						var period = object[pingerTitle].period
						var last = object[pingerTitle].last
						if (typeof period != 'number' ||
							typeof last != 'number') {
							result = pingerTitle + ': numbers corrupt'
							break 
						}
						var age = now - last
						if (age > 2 * period) {
							result = pingerTitle + ': stale success time, age s:' + age
							break
						}
					}
				}
			}
		}
		if (result) result = 'Checking ' + title + ': ' + result
		return result
	}

}

// get the current unix timestamp
function unixTimestampNow() {
	return Math.floor(Date.now() / 1000)
}
