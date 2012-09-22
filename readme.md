# haraldops
Facilitates configuration, operation and service notifications for node.js applications

## Benefits

1. Configure the apps in json from outside its source tree
2. Single-line setup of operations details
3. Email communications from your apps
4. Monitor incoming requests with user agent string and origin
5. Capture console output with log file output, rotate, and error stack traces
6. Self-monitor by having multiple deployments monitor each other as well as external apps and Web locations
7. Portably find function-specific folders and access the system browser
8. Load app-specific json data from configurable out-of-source tree locations

## Features

1. Flexible loading of out-of-source tree json data
2. Email service wrapping various implementations including gmail
3. Configurable heartbeat pinger-responder
4. Express request logging
5. stdout to file management
5. OS portability layer

# Usage
## Loading per-machine configuration
```js
var defaults = require('haraldops').init({appName: 'Node.js #3'})
```
* Derives a filesystem friendly app identifier a-z0-9, in this case 'nodejs3'
* Looks for a .json file by this name  in $HOME/apps, $HOME or the folder the executing app is deployed to.
* Loads the json and configures accordingly

The following values are known to be present in the returned object:
* defaults.init.appName: string Name of the application eg. 'Node.js #3'
* defaults.init.identifier: string Identifier to use eg. 'nodejs3'
* defaults.init.appFolder: string Path to the apps folder eg. '/home/user/folder'
* defaults.init.tmpFolder: string Path to a suitable temporary folder eg. '/home/user/tmp' or '/tmp'
* defaults.init.homeFolder string Path to user's home folder eg. '/home/user'
* defaults.init.logger function configured logging function

These top-level properties affects init:
* logger: function, optional: log to this function, default is console.log
* appName: string, optional: app name used, default is the name of the folder where the executing app is
* identifier: string, optional: identifier used when locating settings files, default is derived from appName
* NoFile: boolean, optional: if present and true, no file is loaded

Other properties are copied to the return value object

Properties loaded from file override those provided in argument

# Examples

## Sending Mail
using argument object:
```js
var defaults = require('haraldops').init({
	haraldops: {
		mailsend: {
			user: 'sender@gmail.com',
			pass: 'password',
			to: 'recipient@gmail.com',
		},
	},
	noFile: true,
})
defaults.init.ops.sendMail('subject', 'body')
```

Using a configuration file godo.json:
```js
{
	"haraldops": {
		"mailsend": {
			"user": "sender@gmail.com",
			"pass": "password",
			"to": "recipient@gmail.com"
		}
	}
}
```

```js
var defaults = require('haraldops').init({appName: 'Go Do'})
defaults.init.ops.sendMail('subject', 'body')
```

## Sample Configuration File
```js
{
	"PORT": 3000,
	"haraldops": {
		"mailsend": {
			"user": "sender@gmail.com",
			"pass": "password",
			"to": "recipient@gmail.com"
		},
		"responder": "/status",
		"identifier": "thisapp",
		"pingers": [
			{
				"title": "Make sure Google is up",
				"url": "http://www.google.com/",
				"isPingerList": false			
			},
			{
				"title": "Another deployment",
				"url": "http://www.example.com/status",
				"app": "monitoredappidentifier"
			}
		]
	},
	"fbAppSecret": "55555",
	"appInterface": "localhost",
	"sessionSecret": "verygreat",
	"ignoreUris": [
		"/status",
		"/favicon.ico",
		"regexp:/images.*",
		"regexp:/stylesheets.*",
		"regexp:/javascripts.*"
	]
}
```

## Monitoring of Google
Will send email if Google does not respond for 5 minutes
```js
var ops = require('haraldops').opsconstructor({
	haraldops: {
		mailsend: {
			user: 'sender@gmail.com',
			pass: 'password',
			to: 'recipient@gmail.com',
		},
		pingers: [
			{
				title: "Google",
				url: "http://google.com",
				isPingerList: false
			}
		]
	},
	noFile: true,	
})
```

# Configuration Reference

* haraldops.errorstack: true: adds
* haraldops.logFile: '/tmp/x': copies console output to the provided file
* haraldops.logRotate: 'day': period of rotation minute hour day month year

# Function Reference

## logrequest(logger, ignoreTheseUris)
```js
var haraldops = require('haraldops')
var ignoreUris = [
	'/status', '/favicon.ico', /\/images.*/,
	/\/stylesheets.*/, /\/javascripts.*/,
]
app = express.createServer()
app.configure(function(){
	app.use(haraldops.logrequest(console.log, ignoreUris))
...
```
Logs incoming requests. Handles load-balancer forwarding.

* logger: a function that prints a single string argument
* ignoreTheseUris a string, a regexp or an array of those types: do not log these requests

output: Time stamp, request method, host, client and user agent string
```
2012-05-16T23:11Z GET http://localhost:3000/ 127.0.0.1:53169 Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.46 Safari/536.5
```

## defaults.init.ops.sendMail(subject, body)
Send mail using the object returned by opsconstructor or mailconstructor.

## defaults.init.ops.closeMail()
Closes mail when all pending messages has been sent. Function property of the object returned by opsconstructor or mailconstructor.

## defaults.init.ops.responder(app, url)
```js
var haraldops = require('haraldops')
var o = {
	user: 'sender@gmail.com', pass: 'secret', to: 'me@gmail.com',
	responder: '/status'
}
var opsObject = haraldops.opsconstructor(console.log, o)
var app = express.createServer()
opsObject.responder(app, o.responder)
```
* app a server from connect or express
* url a uri where server status is provided, eg. '/status'

## defaults.init.ops.pinger(optsArg)
* optsArg
	* title: the printable name of the server being checked eg. 'My box'
	* url: the url for that server, eg. 'http://server.com/status'
	* period (optional, default 300): the number of seconds between each check
	* isPingerList (optional, default yes): if true the entire response is examined for times and consistency. If false, the response has to be error free and have status code 200
	* app the expected app identifier at that url

## defaults.init.ops.shutDown()
Deactivates the opsObject

## loadDefaultFile()
Loads ~/haraldops.json and returns the json object
