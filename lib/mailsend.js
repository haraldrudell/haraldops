// mailsend.js
// encapsulate nodemailer

// https://github.com/andris9/nodemailer
var nodemailer = require("nodemailer")
var jsonloader = require('./jsonloader')

module.exports.mailconstructor = constructor

// class variables
var mustHaves = ['service', 'user', 'pass', 'to']
var defaultOpts = {service: 'Gmail'}
var cbClose = []

// instantiate per sending account and recipient
// logger: function to use for progress messages, default none
// optsArg: email settings: user pass to service
function constructor(logger, optsArg) {
	var opts = jsonloader.getOpts(optsArg, defaultOpts, mustHaves, false)
	
	var smtpTransport
	var pendingSends = 0
	var shutDown

	return {
		sendMail: sendMail,
		closeMail: closeMail
	}

	// send an email
	function sendMail(subject, body) {

		// lazy prepare connection
		if (!smtpTransport && !shutDown) {
			logger('mail starting')
			smtpTransport = nodemailer.createTransport("SMTP", {
				service: opts.service,
				auth: {
					user: opts.user,
					pass: opts.pass,
				}
			})
		}

		// send
		pendingSends++
		smtpTransport.sendMail({
			to: opts.to,
			subject: subject,
			body: body
		}, function(error, success) {
			pendingSends--
			if (error) logger('Message ' + (success ? 'sent' : 'failed'))
			if (shutDown && !pendingSends) closeMail()
		})
	}

	// shut down email server when pending sends complete
	function closeMail(cb) {
		shutDown = true

		if (smtpTransport) { // we are active
			if (!pendingSends) { // and not sending: close now
				var s = smtpTransport
				smtpTransport = undefined
				s.close(closeResult)
			// shutdown flag will cause this to be invoked
			} else if (cb) cbClose.push(cb)
		} else if (cb) cb()
	}

	function closeResult(err) {
		logger('mail shut down')
		var cbs = cbClose
		cbClose = []
		cbs.forEach(function (aCb) {
			aCb(err)
		})
		if (err && cbs.length == 0) throw err
	}
}
