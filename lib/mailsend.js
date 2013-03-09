// mailsend.js
// encapsulate nodemailer
// © 2013 Harald Rudell <harald.rudell@therudells.com> (http://haraldrudell.com) All rights reserved.

var jsonloader = require('./jsonloader')
// https://github.com/andris9/nodemailer
var nodemailer = require("nodemailer")

exports.mailconstructor = constructor

var mustHaves = ['service', 'user', 'pass', 'to']
var defaultOpts = {service: 'Gmail'}

/*
Send mail to a single address with lazy server start
logger: optional function, default none: util.format-style progress messages
optsArg: object: email settings: .user .pass to service
*/
function constructor(logger, optsArg) {
	var opts = jsonloader.getOpts(optsArg, defaultOpts, mustHaves, false)
	var smtpTransport
	var pendingSends = 0
	var isShutdown
	var cbClose = []

	if (typeof logger !== 'function') logger = function () {}

	return {
		sendMail: sendMail,
		closeMail: closeMail
	}

	/*
	Send an email
	either: subject, body: both strings
	or object, cb(err, success): .subject, .body .html

	success is an object like: {
		failedRecipients: 0[],
		message: '250 2.0.0 OK 1362860038 ix6sm11724250pbc.17 - gsmtp',
		messageId: '1362860035406.f277f965@Nodemailer'
	}
	*/
	function sendMail(subject, body) {
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null

		if (!isShutdown) {
			if (!smtpTransport) { // lazy init of mail client
				logger('mail starting')
				smtpTransport = nodemailer.createTransport('SMTP', {
					service: opts.service,
					auth: {
						user: opts.user,
						pass: opts.pass,
					}
				})
			}

			var sendOpts = {to: opts.to}
			if (typeof args[0] === 'string' &&
				typeof args[1] === 'string') {
				sendOpts.subject = args[0]
				sendOpts.body = args[1]
			} else for (var p in args[0]) sendOpts[p] = args[0][p]
			pendingSends++
			smtpTransport.sendMail(sendOpts, sendComplete)
		} else if (cb) cb(new Error('Mail is shutdown'))

		function sendComplete(err, success) {
			if (!--pendingSends && isShutdown) closeMail()
			if (err) logger('Message', success ? 'sent' : 'failed')
			if (cb) cb(err, success)
		}
	}

	// shut down email server when pending sends complete
	function closeMail(cb) {
		isShutdown = true

		if (smtpTransport) { // we are active
			if (cb) cbClose.push(cb) // save the callback
			if (!pendingSends) { // and not sending: close now
				var s = smtpTransport
				smtpTransport = undefined
				s.close(closeResult)
			} // otherwise shutdown flag will cause closeMail to be invoked
		} else if (cb) cb()

		function closeResult(err) {
			logger('mail shut down:', cbClose.length)
			if (cbClose.length) {
				var cbs = cbClose
				cbClose = []
				cbs.forEach(invoke)
			} else if (err) throw err

			function invoke(aCb) {
				aCb(err)
			}
		}
	}
}
