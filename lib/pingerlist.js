// pingerlist.js
// maintain status of all pingerlist

module.exports = constructor

// class variables
function constructor(maxAge) {
	// instance variables
	// key: title, value : { period: second, last: unix timestamp }
	var pingerlist = {}
	if (!maxAge) maxAge = 60

	instance.addPinger = addPinger
	instance.getResponderString = getResponderString
	instance.updateSuccess = updateSuccess
	instance.checkResponse = checkResponse
	return instance

	function instance() {}

	function addPinger(title, period) {
		pingerlist[title] = {period: period, last: unixTimestampNow() }
	}

	// update last field for a test that just succeeded
	function updateSuccess(title) {
		pingerlist[title].last = unixTimestampNow()
	}

	// produce a string that can be sent over the web
	function getResponderString() {
		var object = pingerlist
		object['now'] = unixTimestampNow()
		var string = JSON.stringify(object)
		return string
	}

	// return value: null: object and all checks are ok
	// otherwise: printable issue string
	function checkResponse(title, string) {
		var now = unixTimestampNow()
		var heading = 'Checking ' + title + ': '

		var result = null

		// get the object
		var object = null
		if (string != null && string.constructor == String) object = JSON.parse(string)
		if (!object || !object.hasOwnProperty('now')) {
			result = heading + 'Bad response format'
		} else {

			// check now field
			var timestamp = object.now
			if (timestamp == null ||
				timestamp.constructor != Number ||
				now - timestamp > maxAge) {
				result = heading + 'stale response age'
			} else {

				// examine each pingresult entry
				for (var title in object) {
					if (title != 'now') {
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

function unixTimestampNow() {
	return Math.floor(Date.now() / 1000)
}
