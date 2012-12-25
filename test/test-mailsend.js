// test-mailsend.js
// © Harald Rudell 2012

var mailsend = require('../lib/mailsend')

// https://github.com/andris9/nodemailer
var nodemailer = require("nodemailer")

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var ct = nodemailer.createTransport

exports['MailSend:'] = {
	'mailconstructor': function (done) {
		var opts = {
			user: 'USER',
			pass: 'PASS',
			to: 'TO',
		}
		var logger = function () {}
		var subject = 'SUBJECT'
		var body = 'BODY'
		var aTransport = 0
		var aSend

		// constructor
		var actual = mailsend.mailconstructor(logger, opts)
		assert.ok(actual)
		assert.equal(typeof actual.sendMail, 'function')
		assert.equal(typeof actual.closeMail, 'function')

		// sendMail
		actual.sendMail(subject, body)

		// closeMail
		actual.closeMail(closeResult)

		function closeResult(err) {
			if (err) assert.equal(err, null)

			done()
		}

		function mockCreateTransport(transport, opts) {
			aTransport++
			assert.ok(opts)
			assert.ok(opts.auth)
			assert.equal(opts.auth.user, opts.user)
			return {
				sendMail: mockSendMail,
				close: mockClose,
			}
		}
		function mockSendMail(opts0, cb) {
			aSend++
			assert.ok(opts0)
			assert.equal(opts0.to, opts.to)
			assert(typeof cb, 'function')
			cb()
		}
		function mockClose(cb) {
			cb()
		}
	},
	'after': function () {
		nodemailer.createTransport = ct
	},
}