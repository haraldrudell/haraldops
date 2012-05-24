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
	if (typeof identifier != 'string') throw('string identifier required')
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
		var now = unixTimestampNow()
		var heading = 'Checking ' + title + ': '

		var result = null

		// get the object
		var object = null
		if (string != null && string.constructor == String) {
			try {
				object = JSON.parse(string)
			} catch (e) { // ignore SyntaxError
			}
		}
		if (!object || !object.hasOwnProperty(app)) {
			result = heading + 'Bad response format'
		} else {

			// check now field
			var timestamp = object[app]
			if (timestamp == null ||
				timestamp.constructor != Number ||
				now - timestamp > maxAge) {
				result = heading + 'stale response age'
			} else {

				// examine each pingresult entry
				for (var title in object) {
					if (title != app) {
						var period = object[title].period
						var last = object[title].last
						var age = now - last
						if (age > 2 * period) {
							result = heading + title + ' stale success time, age s:' + age
							break
						}
					}
				}
			}
		}
		return result
	}

}

// get the current unix timestamp
function unixTimestampNow() {
	return Math.floor(Date.now() / 1000)
}
