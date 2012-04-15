// ops.js
// check and provide responses for reliability

var pingerlists = require('./pingerlist')
var request = require('request')
var haraldutil = require('haraldutil')
var os = require("os")

exports.mailconstructor = require('./mailsend')
exports.opsconstructor = opsconstructor
exports.defaults = require('./defaults')

// class variables
var minSeconds = 300
var q5Title = 'Home Server'
var q5 = 'http://q5.gotdns.com'

function opsconstructor(logger, user, pass, to, testmail, mockupRequest) {
	if (!logger) logger = function () {}
	if (mockupRequest) request = mockupRequest
	// max age 60 seconds
	var pingerlist = pingerlists(60)
	var instance = exports.mailconstructor(logger, user, pass, to)
	var intervals = []
	instance.responder = responder
	instance.pinger = pinger
	instance.pingQ5 = pingQ5
	instance.shutDown = shutDown
	return instance

	// response provided at url /status for ther servers checking up on this one
	// response: { now: timestamp,
	//	{ 'title' : { period: nsecond, last: timestamp}}}
	function responder(app, url) {
		app.get(url, function(req, res) {
			if (testmail && req.query['mail']) {
				// send test mail
				mailsend.sendMail('Test Mail Requested',
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
	function pinger(title, url, period) {
		if (typeof period != 'number' || period < minSeconds) period = minSeconds
		intervals.push(setInterval(ping, period * 1000))
		pingerlist.addPinger(title, period)
		ping()
		var requestTime

		function ping() {
			try {
				logger('ping:' + title)
				requestTime = new Date()
				request(url, function(error, response, body) {
					var trouble
					if (error) trouble = 'Error:' + error.toString()
					else if (response.statusCode != 200) {
						trouble = 'Status code:' + response.statusCode
					} else if (url != q5) { // check response
						trouble = pingerlist.checkResponse(title, body)
					}
					if (trouble) sendMail(trouble)
					else pingerlist.updateSuccess(title)
				})
			} catch (e) {
				console.log(e.stack)
				sendMail('Exception:' + e.toString())
			}
		}

		function sendMail(issue) {
			//clearInterval(interval)
			var subject = 'IssueWith:' + title
			var body = 'Pinging url:\'' + url + '\' at ' +
				haraldutil.timeUtil.getDateString(
					haraldutil.timeUtil.getTimestamp(requestTime)
					) + '\n' +
				'from host ' + os.hostname() + '\n' +
				issue + '\n'

			logger(subject + body)
			instance.sendMail(subject, body)
		}
	}

	// verify q5 availability every minutes
	function pingQ5() {
		pinger(q5Title, q5)
	}

	function shutDown() {
		intervals.forEach(function(interval) {
			clearInterval(interval)
		})
		instance.closeMail()
	}

}