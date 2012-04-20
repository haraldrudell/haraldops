// ops.js
// check and provide responses for reliability

// imports
var pingerlists = require('./pingerlist')
var request = require('request')
var haraldutil = require('haraldutil')
var defaults = require('./defaults')
// http://nodejs.org/docs/latest/api/os.html
var os = require("os")

// exports
exports.mailconstructor = require('./mailsend')
exports.opsconstructor = opsconstructor
exports.defaults = defaults

// class variables
// minimum frequency of any check in seconds
var minSeconds = 300
var defaultMaxAge = 60

// instantiate an operations instance
// logger: function to use for progress messages, default none
// opts: optional maxAge: integer
// check for mandatory opts fields in mailsend.js
// mockupRequest: do not use, for testing
function opsconstructor(logger, opts, mockupRequest) {
	// parse arguments
	if (!logger) logger = function () {}
	if (mockupRequest) request = mockupRequest
	if (typeof opts == 'undefined') opts = loadDefaultFile()

	// create pingerList with default max age
	var pingerlist = pingerlists((opts || {}).maxAge || defaultMaxAge)
	// array of timers for each pinger
	var intervals = []

	var instance = exports.mailconstructor(logger, opts)
	instance.responder = responder
	instance.pinger = pinger
	instance.shutDown = shutDown

	if (opts.pingers) {
		var list = opts.pingers
		if (Array.isArray(list)) list.forEach(function (pingObject) {
			pinger(pingObject)
		})
	}

	return instance

	// response provided at url /status for ther servers checking up on this one
	// response: { now: timestamp,
	//	{ 'title' : { period: nsecond, last: timestamp}}}
	function responder(app, url) {
		app.get(url, function(req, res) {
			if (opts.testmail && // testmail feature is enabled
			 	req.query.hasOwnProperty('mail') && // it is requested: /status?mail=
			 	req.connection.remoteAddress == '127.0.0.1') { // and from localhost
				// repond with a test mail
				instance.sendMail('Test Mail Requested by localhost',
					'from host ' + os.hostname() +
					' at ' + haraldutil.timeUtil.getDateString())
			}

			// write the response
			res.send(pingerlist.getResponderString(),
				{'Content-Type': 'application/json'},
				200)
		})
		logger('Responder registered at ' + url)
	}

	// add a period check of another server
	function pinger(optsArg) {

		// parse arguments
		var opts = defaults.getOpts(optsArg, { period: period }, [ 'title', 'url'])
		if (typeof opts.period != 'number' || period < minSeconds) opts.period = minSeconds

		intervals.push(setInterval(ping, opts.period * 1000))
		pingerlist.addPinger(opts.title, opts.period)
		ping()
		var requestTime

		function ping() {
			try {
				logger('ping:' + opts.title)
				requestTime = new Date()
				request(opts.url, function(error, response, body) {
					var trouble
					if (error) trouble = 'Error:' + error.toString()
					else if (response.statusCode != 200) {
						trouble = 'Status code:' + response.statusCode
					} else if (opts.isPingerList) { // check response
						trouble = pingerlist.checkResponse(opts.title, body)
					}
					if (trouble) sendMail(trouble)
					else pingerlist.updateSuccess(opts.title)
				})
			} catch (e) {
				console.log(e.stack)
				sendMail('Exception:' + e.toString())
			}
		}

		function sendMail(issue) {
			//clearInterval(interval)
			var subject = 'IssueWith:' + opts.title
			var body = 'Pinging url:\'' + opts.url + '\' at ' +
				haraldutil.timeUtil.getDateString(
					haraldutil.timeUtil.getTimestamp(requestTime)
					) + '\n' +
				'from host ' + os.hostname() + '\n' +
				issue + '\n'

			logger(subject + body)
			instance.sendMail(subject, body)
		}
	}

	function shutDown() {
		intervals.forEach(function(interval) {
			clearInterval(interval)
		})
		instance.closeMail()
	}

}