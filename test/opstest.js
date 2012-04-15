// opstest.js
// unit test for ops.js
// https://github.com/caolan/nodeunit
// http://nodejs.org/docs/latest/api/all.html

var ops = require('../lib/ops')
var pingerlist = require('../lib/pingerlist')

exports.testPinger = testPinger

function testPinger(test) {

	var opsUrl = '/status'

	// create ops instance
	var opsinstance = ops.opsconstructor(console.log, 'user', 'pass', 'to', false, mockupRequest)

	// setup mockup mailsend: should not be invoked
	opsinstance.sendMail = mockupSendMail

	// setup our mockup responding server for requests from ops
	var pingerlistInstance = pingerlist()
	var mockupRequestInvocations = 0

	// make sure that ops register its responding route
	var app = mockupServerInstance()
	opsinstance.responder(app)
	test.ok(app.gets[opsUrl], 'ops.responder failed to register the /status route')

	// add a pinger - it will be immediately invoked
	var title = 'TestPing'
	var pingerUrl = 'http://nowhere'
	var period = 10
	opsinstance.pinger(title, pingerUrl, period)
	test.equal(mockupRequestInvocations, 1, 'ops did not invoke request')

	// check pinger status
	var response = app.request(opsUrl)

	// make our own brief check
	var object = JSON.parse(response)
	var printableResponse = ': \'' + response + '\''
	test.ok(object != null, 'Response not json' + printableResponse)
	if (Object.keys(object).length != 2 ||
		!object.hasOwnProperty('now') ||
		!object.hasOwnProperty(title))
		test.ok(false, 'Response properties incorrect' + printableResponse)
	var value = object.now
	if (value == null || value.constructor != Number)
		test.ok(false, 'Response now value not numeric' + printableResponse)
	var testObject = object[title]
	if (testObject == null || Object.keys(testObject).length != 2)
		test.ok(false, 'Response data object properties bad' + printableResponse)
	var value = testObject.period	
	if (value == null || value.constructor != Number)
		test.ok(false, 'Response data period not numeric' + printableResponse)
	var value = testObject.last
	if (value == null || value.constructor != Number)
		test.ok(false, 'Response data last not numeric' + printableResponse)


	// do official check
	var result = pingerlistInstance.checkResponse(title, response)
	test.equal(result, null, 'ops response bad:' + result)



	// shut down pinger
	opsinstance.shutDown()

	test.done()

	// mockup responding server
	function mockupRequest(url, callback) {
		test.equal(url, pingerUrl, 'ops.pinger invoked request with a bad url')
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

		function get(url, middleware) {
			app.gets[url] = middleware
		}

		function request(url) {
			var response
			var writeHeadInvocation = 0

			// make sure ops initialized the url
			var opsMiddleware = app.gets[url]
			test.ok(opsMiddleware, 'test url was not registered by ops')

			// execute the request
			opsMiddleware(undefined, {
				writeHead: writeHead,
				send: send
			})

			// check outcome, return response
			test.equal(writeHeadInvocation, 1, 'ops did not set response code')
			return response

			// reponse.writeHead mockup
			function writeHead(code, json) {
				test.equal(code, 200, 'ops responded with bad status code')
				writeHeadInvocation++
			}

			// response.send mockup
			function send(json) {
				response =json
			}

		}
	}

}
