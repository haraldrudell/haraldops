// pingertest.js
// unit test for init.js

// https://github.com/caolan/nodeunit
// http://nodejs.org/docs/latest/api/all.html

var ops = require('../lib/ops')
var pingerlist = require('../lib/pingerlist')

module.exports = {
	testPinger: testPinger,
}

function testPinger(test) {
	// we will test an opsinstance pinging a remote pingerlist instance

	// 1. instantiate opsintance
	// create ops responding instance
	// mail settings
	// the running app is respondingapp
	// when it verifies a pinger, it uses mockupRequest
	var opsAppId = 'myopsinstance'
	var opts = {
		mailsend: {
			'user': 'u',
			'pass': 'p',
			'to': 'x',
		},
		'identifier': opsAppId,
	}
	var logger = console.log
	var opsinstance = ops.opsconstructor(logger, opts,  mockupRequest)
	var mockupRequestInvocations = 0
	// setup mockup mailsend: should not be invoked
	opsinstance.sendMail = mockupSendMail

	// 2. create a mockup remote server responding to pings from opsinstance
	var pingedAppIdentifier = 'respondingapp'
	var pingerlistInstance = pingerlist(pingedAppIdentifier)

	// 3. add a pinger - it will be immediately invoked
	var pingerOpts = {
		title: 'TestPing',
		url: 'http://nowhere',
		period: 10,
		app: pingedAppIdentifier,
	}
	opsinstance.pinger(pingerOpts)
	test.equal(mockupRequestInvocations, 1, 'ops did not invoke request')

	// 4. allow our opsinstance to respond to status requests from the Internet
	// make sure that ops register its responding route
	var opsUrl = '/status'
	var responderOpts = {
		app: opsAppId,
	}
	var app = mockupServerInstance()
	opsinstance.responder(app, opsUrl)
	test.ok(app.gets[opsUrl], 'ops.responder failed to register the /status route')

	// 5. request pinger /status from our ops instance being tested
	var response = app.request(opsUrl)

	// 6. make our own brief check
	var object = JSON.parse(response)
	var printableResponse = ': \'' + response + '\''
	test.ok(object != null, 'Response not json' + printableResponse)
	if (Object.keys(object).length != 2 ||
		!object.hasOwnProperty(opts.identifier) ||
		!object.hasOwnProperty(pingerOpts.title))
		test.ok(false, 'Response properties incorrect' + printableResponse)
	var value = object[opts.identifier]
	if (value == null || value.constructor != Number)
		test.ok(false, 'Response now value not numeric' + printableResponse)
	var testObject = object[pingerOpts.title]
	if (testObject == null || Object.keys(testObject).length != 2)
		test.ok(false, 'Response data object properties bad' + printableResponse)
	var value = testObject.period	
	if (value == null || value.constructor != Number)
		test.ok(false, 'Response data period not numeric' + printableResponse)
	var value = testObject.last
	if (value == null || value.constructor != Number)
		test.ok(false, 'Response data last not numeric' + printableResponse)

	// 7. do official check
	// undefined is returned on success, otherwise a textual error message
	var result = pingerlistInstance.checkResponse(responderOpts, response, opts.identifier)
	test.equal(result, null, 'ops response bad:' + result)

	// 8. shut down pinger
	opsinstance.shutDown()

	test.done()

	// mockup responding server
	function mockupRequest(url, callback) {
		test.equal(url, pingerOpts.url, 'ops.pinger invoked request with a bad url')
		test.equal(mockupRequestInvocations, 0, 'ops.pinger invoked request more than once')
		mockupRequestInvocations++
		callback(null, { statusCode: 200},
			pingerlistInstance.getResponderString())
	}

	// mockup sendMail: should not be invoked
	function mockupSendMail(subject, body) {
		test.ok(false, 'ops should not invoke mailsend.sendMail:' +
			' subject:' + subject +
			' body:' + body)
	}

	// a mockup server where ops can register its uri
	// we can submit request
	function mockupServerInstance() {
		var app = {}
		// ops uses this method to register its route
		app.get = get
		// store routes
		app.gets = {}
		// we can submit requests to ops here
		app.request = request
		return app

		// register a get handler
		function get(url, middleware) {
			app.gets[url] = middleware
		}

		// this test execute a ping request to the tested ops instance
		function request(url) {
			var pingerResponseString
			var writeHeadInvocation = 0

			// make sure ops initialized the url
			var opsMiddleware = app.gets[url]
			test.ok(opsMiddleware, 'test url was not registered by ops')

			// execute a request for the tested ops intance to repond to
			var mockRequestInstance
			var mockResponseInstance = {
				writeHead: writeHead,
				send: send				
			}
			opsMiddleware(mockRequestInstance, mockResponseInstance)

			// check outcome, return response
			test.equal(writeHeadInvocation, 1, 'ops did not set response code:' + writeHeadInvocation)
			return pingerResponseString

			// reponse.writeHead mockup
			function writeHead(code, json) {
				test.equal(code, 200, 'ops responded with bad status code:' + code)
				writeHeadInvocation++
			}

			// response.send mockup
			function send(jsonString, headerObject, statusCode) {
				if (headerObject || statusCode) writeHead(statusCode, headerObject)
				pingerResponseString =jsonString
			}

		}
	}

}