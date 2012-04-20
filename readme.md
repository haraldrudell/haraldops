# haraldops
Facilitates deployment configuration and in-service monitoring for node applications
# Usage
## Read deployment configuration
````
var haraldops = require('haraldops')
// get settings from ~/haraldops.json
var defaults = loadDefaultFile()
// load from ~/myAppName.json
// or /folder/myAppName.json or /usr/myAppName.json
var otherDefaults = load('myAppName', [ '/folder', '/usr' ])
````
### sample json file
Enable email sending and add monitoring of Google:
	{
		user: "mysendaccount@gmail.com",
		pass: "mysendaccountpassword",
		to: "ireademailhere@email.com",
		pingers: [
			{
				title: "Google",
				url: "http://google.com",
				isPingerList: false
			}
		]
	}
## Manually add monitoring of Google
````
	var haraldops = require('haraldops')
	var ops = haraldops.opsconstructor(console.log)
	// monitor google.com every 5 minutes
	ops.pinger({ title: 'Google',
		url: 'http://google.com',
		isPingerList: false})
````
## Allow your app to email you
````
// read deployment defaults from ~/settings.json
var defaults = ops.defaults()
var mail = haraldops.mailconstructor(console.log, defaults)
mail.sendMail('subject', 'body')
````
# Reference
## ops = require('haraldops')
## ops.mailconstructor(logger, opts)
* logger: function to use for progress messages, default none
* opts: email settings: user pass to service
## mailObject.sendMail(subject, body)
## mailObject.closeMail()
## ops.opsconstructor(loggerFunc, opts)
* logger: function to use for progress messages, default none
* opts: email settings: user pass to service
** optional maxAge number of seconds a monitored server can have failed tests
## opsObject.responder(app, url)
* app a server from connect or express
* url a uri where server status is provided, eg. '/status'
## opsObject.pinger(optsArg)
* .title: the printable name of the server being checked eg. 'My box'
* .url: the url for that server, eg. 'http://server.com/status'
* .period (optional, default 300): the number of seconds between each check
* .isPingerList (optional, default no): if true the entire response is examined for times and consistency. If false, the response has to be error free and have status code 200
## opsObject.shutDown()
Deactivates the opsObject
## ops.defaults()