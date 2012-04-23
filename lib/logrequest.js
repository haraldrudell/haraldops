// logrequest.js
// log every incoming request

module.exports = init

function init(logger, behindBalancer, protocol, responderUri) {

	return function logAll(req, res, next) {
		// only log if it is not ops responder ping
		if (req.url != responderUri) {
			logger(logString(req))
		}
		next()
	}

	// log requests
	// request: request object
	// return value: printable string describing the request
	function logString(request) {
		var info = request.method // 'GET'
		if (request.headers) {

			// 'http' or 'https'
			var aProtocol
			// string numeric
			var aPort
			var host = request.headers.host || 'host?'
			var from

			if (behindBalancer) {
				aProtocol = request.headers['x-forwarded-proto'] || '?'
				aPort = request.headers['x-forwarded-port'] || 'port?'
				from = (request.headers['x-forwarded-for'] || 'from?')
			} else {
				aProtocol = protocol
				// aPort is included in host
				from = request.connection.socket.remoteAddress ||
					request.socket.remoteAddress
			}
			var defaultPort = aProtocol == 'https' ? 443 : 80

			info += ' ' + aProtocol + '://' + host
			if (aPort && aPort != defaultPort) info += ':' + aPort
			info += request.url +
				' from ' + from +
				' ua:' + (request.headers['user-agent'] || '-')
		}

		return info	
	}

}
