# haraldops
Facilitates configuration, operation and service notifications for node.js applications
# Usage
## Configuration Files
### Using default filename
 ~/haraldops.json

```js
var haraldops = require('haraldops')
var defaults = loadDefaultFile()
```

### Using an App Name
~/myAppName.json or ./myAppName.json

```js
var haraldops = require('haraldops')
var otherDefaults = load('myAppName', __directory)
```

### Using script filename

```js
var haraldops = require('haraldops')
// in mycode.js: loads from ./mycode.json or ~/mycode.json
var opts = haraldops.defaults(__file + 'on')
```

### Sample configuration file contents
Enable email sending and add monitoring of Google:

```js
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
```

* Default transport is Gmail, supply your credentials
* Any suitable transport can be used as outlined for nodemailer

## Manually add monitoring of Google

```js
	var haraldops = require('haraldops')
	// get settings from ~/haraldops.json
	var ops = haraldops.opsconstructor(console.log)
	// monitor google.com every 5 minutes
	ops.pinger({ title: "Google",
		url: "http://google.com",
		isPingerList: false})
```

## Allow your app to email you

```js
var haraldops = require('haraldops')
// read deployment defaults from ~/haraldops.json
var mail = haraldops.mailconstructor()
mail.sendMail('subject', 'body')
```

# Reference
## ops.mailconstructor(logger, opts)
* logger: function to use for progress messages, default none
* opts: email settings, keys: user pass to service

## errorstack()
```js
var haraldops = require('haraldops')
haraldops.errorstack()
```
Adds a stack trace to any invocation of console.error or console.warn. Some native code , eg. the http module, invokes these functions on difficulties, having a stack trace facilitates troubleshooting of those situations.
```
This type of response MUST NOT have a body. Ignoring data passed to end().
Error: console.error invocation
    at Error (unknown source)
    at Object.myConsoleError (/home/fasenode/nodejs3/app.js:71:10)
    at ServerResponse.end (http.js:662:13)
    at /home/fasenode/nodejs3/node_modules/express/node_modules/connect/lib/middleware/session.js:281:15
    at Array.0 (/home/fasenode/nodejs3/node_modules/express/node_modules/connect/lib/middleware/session/memory.js:75:11)
    at EventEmitter._tickCallback (node.js:190:38)
```

## haraldops.logrequest(logger, ignoreTheseUris)
```js
var haraldops = require('haraldops')
var ignoreUris = [
	'/status', '/favicon.ico', /\/images.*/,
	/\/stylesheets.*/, /\/javascripts.*/,
]
...
app.configure(function(){
	app.use(haraldops.logrequest(console.log, ignoreUris))
...
```
Logs incoming requests.

* logger: a function that prints a single string argument
* ignoreTheseUris a string, a regexp or an array of those types: do not log these requests

output

Time stamp, request method, host, client and user agent string
```
2012-05-16T23:11Z GET http://localhost:3000/ 127.0.0.1:53169 Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.46 Safari/536.5
```

## mailObject.sendMail(subject, body)

## mailObject.closeMail()
Closes mail when all pending messages has been sent

## ops.opsconstructor(loggerFunc, opts)
* logger: function to use for progress messages, default none
* opts: settings, keys: user pass to service maxAge pingers
	* maxAge: number of seconds a monitored server can have failed tests
	* pingers: array of argument objects for pinger()

## opsObject.responder(app, url)
* app a server from connect or express
* url a uri where server status is provided, eg. '/status'

## opsObject.pinger(optsArg)
* optsArg keys:
	* title: the printable name of the server being checked eg. 'My box'
	* url: the url for that server, eg. 'http://server.com/status'
	* period (optional, default 300): the number of seconds between each check
	* isPingerList (optional, default no): if true the entire response is examined for times and consistency. If false, the response has to be error free and have status code 200

## opsObject.shutDown()
Deactivates the opsObject

## haraldops.defaults(appName, defaultFolders, ignoreHome)
* appname, may include folder and extension.
* defaultFolder: single folder or array of folders, no terminating slash
* ignoreHome: do not search in user's home folder

## haraldops.getOpts(optsArg, defaultOpts, mustHaves, defaultFile)
Parse option argument to a function
* optsArg: provided options
* defaultOpts: merged-in defaul options
* mustHaves: array of strings, each argument must be present and have string value. If one is missing an exception is thrown
* defaultFile: fully qualified filename used in exception printout

## haraldops.loadDefaultFile()
Loads ~/haraldops.json and returns the json object

## haraldops.getHomeFolder()

## haraldops.getTmpFolder()

## haraldops.tee(opts)
Copies console.log and console.err output to the named file
* opts:
	* logFolder optional folder, default home folder
	* logFile: filename or complete path eg. '/tmp/nodelog'
	* logRotate: period of rotation minute hour day month year
example:

```js
haraldops.tee({
	logFile: '/tmp/nodelog,
	logRotate: 'day'
})
```

It's cool! 