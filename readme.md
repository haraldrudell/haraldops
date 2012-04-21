# haraldops
Facilitates deployment configuration and in-service monitoring for node applications
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

## mailObject.sendMail(subject, body)

## mailObject.closeMail()
Closes mail when all pending messages has been sent

## ops.opsconstructor(loggerFunc, opts)
* logger: function to use for progress messages, default none
* opts: settings, keys: user pass to service maxAge pingers
** maxAge: number of seconds a monitored server can have failed tests
** pingers: array of argument objects for pinger()

## opsObject.responder(app, url)
* app a server from connect or express
* url a uri where server status is provided, eg. '/status'

## opsObject.pinger(optsArg)
* optsArg keys:
** title: the printable name of the server being checked eg. 'My box'
** url: the url for that server, eg. 'http://server.com/status'
** period (optional, default 300): the number of seconds between each check
** isPingerList (optional, default no): if true the entire response is examined for times and consistency. If false, the response has to be error free and have status code 200

## opsObject.shutDown()
Deactivates the opsObject

## haraldops.defaults(appName, defaultFolders, ignoreHome)
* appname, may include folder and extension.
* defaultFolder: single folder or array of folders, no terminating slash
* ignoreHome: do not search in user's home folder

## haraldops.defaults.getOpts(optsArg, defaultOpts, mustHaves, defaultFile)
Parse option argument to a function
* optsArg: provided options
* defaultOpts: merged-in defaul options
* mustHaves: array of strings, each argument must be present and have string value. If one is missing an exception is thrown
* defaultFile: fully qualified filename used in exception printout

## haraldops.defaults.loadDefaultFile()
Loads ~/haraldops.json
