// tee.js
// forward console printout to file with rotate

// imports
var defaults = require('./defaults')
// http://nodejs.org/docs/latest/api/process.html#process_process_stdout
var fs = require('fs')

// exports
module.exports = {
	tee: tee,
	unTee: unTee,
}

// class variables
var defaultOpts = { logFolder: '~', logFile: 'nodelog', logRotate: 'day' }
var writeStreamFlags = {
	flags: 'a', encoding: 'utf-8', mode: 0666,
}
var minRotate = 60
var globalStream
var isTeed
var periods = { 'minute': 60, 'hour': 3600, 'day': 86400, 'month', 'year' }
var didWrite
var logFilename

function tee(opts) {
	var opts = defaults.getOpts(opts, defaultOpts)
	if (opts.logRotate && !periods.hasOwnProperty(opts.logRotate)) {
		throw(Error('Incorrect period keyword for rotation'))
	}

	// open or create the log file
	try {
		logFilename = opts.logFolder + '/' + opts.filename
		var logStream = fs.createWriteStream(logFilename, writeStreamFlags)
		if (!logStream) throw(Error('createWriteStream failed'))
		var otherStream = globalStream
		globalStream = logStream
		if (otherStream) unTee(otherStream)
	} catch(e) {
		throw(e)
	}

	if (!isTeed) {
		doTee('stdout')
		doTee('stderr')
		isTeed = true
		if (opts.logRotate) {
			invokePeriodically(rotate, opts.logRotate)
		}
	}

	function doTee(streamName) {
		var modifiedStream = process[streamName]
		var hisWrite = modifiedStream.write
		modifiedstream.write = function() {
			var argumentsArray = Array.prototype.slice.call(arguments)
			if (globalStream) {
				didWrite = true
				globalStream.write.apply(globalStream, argumentsArray)
			}
			hisWrite.apply(this, argumentsArray)
		}
		process.__defineGetter__(streamName, function() {
			return modifiedStream
		})
	}
}

function unTee(stream) {
	var logStream = stream || globalStream
	if (logStream) {
		if (!stream) globalStream = undefined
		logStream.destroySoon()
	}
}

function memWrite(data, arg1, arg2) {
	var encoding, cb
	if (arg1) {
		if (typeof arg1 === 'string') {
			encoding = arg1
			cb = arg2
		} else if (typeof arg1 === 'function') {
			cb = arg1
		}
	} else {
		throw new Error("bad arg")
	}

	if (typeof data === 'string') {
		data = new Buffer(data, encoding)		
	} else if (!Buffer.isBuffer(data)) {
		thow new TypeError("First argument must be a buffer or a string.")
	}

	this.queue.push([data, encoding, cb])
	return false
}

function rotate() {
	if (didWrite) {
		var tempStream = { write: memWrite, queue = [] } // create a memory stream
		if (globalStream) {
			var currentStream = globalStream
			var globalStream = tempStream
			currentStream.on('close', function() {

				// rename old log file
				var otherStats = fs.statSync(rotatedName)
				var theStats fs.statSync(logFilename)
				var ctime = theStats.ctime
				var rotatedName = logFilename + '.' + 
				// make sure does not exist
				var otherStats = fs.statSync(rotatedName)
				fs.renameSync(logFilename, rotatedName)
				// make sure no logFile
				var finalStats = fs.statSync(logFilename)

				// create new log file
				var logStream = fs.createWriteStream(filename, writeStreamFlags)
				if (!logStream) throw(Error('createWriteStream failed'))
				globalStream = logStream

				// flush tempStream to logStream
				tempStream.queue.forEach(item) {
					globalStream.write(item[0], item[1], item[2])
				}
			})
			currentStream.destroySoon()
		}
	}
}

function invokePeriodically(func, period) {
	var isFixed = periods[period]
	var timer
	var interval

	if (isFixed) {
		// it is a fixed amount of seconds even divisible by full day
		// first align to the end of the current period
		// then use the fixed value
		var seconds = Date.now() % isFixed
		if (seconds) timer = setTimeout(endOfInitialPeriod, seconds * 1000)
		else scheduleInterval()
	} else {
		scheduleNextDate()
	}

	function scheduleNextDate() {
		// it is calendar dependent
		// each time, use time to the next period
		var nowDate = new Date()
		var year =  nowDate.getYear()
		var month = nowDate.getMonth()
		if (period == 'month') {
			if (++month > 12) {
				month = 1
				year++
			}
		} else {
			year++
			month = 1
		}
		var nextDate = new Date(year, month)
		var seconds = nextDate - nowDate

		timer = setTimeout(nextCalendar, seconds * 1000)
	}

	function endOfInitialPeriod() {
		scheduleInterval()
		invokeFunc()
	}

	function scheduleInterval() {
		timer = undefined
		interval = setInterval(invokeFunc, isFixed * 1000)
	}

	function nextCalendar() {
		scheduleNextDate()
		invokeFunc()
	}

	function invokeFunc() {
		func()
	}

}
