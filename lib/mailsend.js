// mailsend.js
// encapsulate nodemailer

var nodemailer = require("nodemailer")
var haraldutil = require('haraldutil')

module.exports = constructor

// instantiate per sending account and recipient
function constructor(logger, user, pass, to) {
	if (!logger) logger = function () {}
	var smtpTransport
	var pendingSends = 0
	var shutDown

	return {
		sendMail: sendMail,
		closeMail: closeMail
	}

	function sendMail(subject, body) {

		// lazy prepare connection
		if (!smtpTransport) {
			logger('mail starting')
			smtpTransport = nodemailer.createTransport("SMTP", {
				service: "Gmail",
				auth: {
					user: user,
					pass: pass
				}
			})
		}

		// send
		pendingSends++
		smtpTransport.sendMail({
			to: to,
			subject: subject,
			body: body
		}, function(error, success) {
			pendingSends--
			if (!haraldutil.checkSuccess(error)) logger('Message ' + (success ? 'sent' : 'failed'))
			if (shutDown) closeMail()
		})
	}

	function closeMail() {
		shutDown = true
		if (smtpTransport && pendingSends == 0) {
			smtpTransport.close()
			smtpTransport = undefined
			logger('mail shut down')
		}
	}

}
