const logModule = require('./logger.js');

const TYPE_LOGIC = 0;
const TYPE_IMPUT_USER = 1;
const TYPE_PARSE = 2;
const TYPE_CONNECT = 3;
const TYPE_INTERNAL = 4;

function Error(messageType, message) {
	this.type = messageType;
	this.message = message;
}
Error.prototype.toString = function() {
	let errType = '';
	switch(this.type) {
		case TYPE_LOGIC:
			errType = 'TYPE_LOGIC';
			break;
		case TYPE_IMPUT_USER:
			errType = 'TYPE_IMPUT_USER';
			break;
		case TYPE_PARSE:
			errType = 'TYPE_PARSE';
			break;
		case TYPE_CONNECT:
			errType = 'TYPE_CONNECT';
			break;
		case TYPE_INTERNAL:
			errType = 'TYPE_INTERNAL';
			break;
		default:
			errType = 'TYPE_DOES_NOT_EXIST';
			break;
	}
	return 'Type: ' + errType + ', Message: ' + this.message;
}

// Proccess errors and respond with expressJS
function proccessAndSendErrors(error, res) {
	logModule.log(logModule.LOG_LEVEL_ERROR, 'Throwing error: ' + error.toString() + ' Message: ' + error.message + ' Stack trace: ' + error.stack);
	switch(error.type) {
		case TYPE_LOGIC:
			res.status(400).json({'response' : 0, 'error': error.message});
			break;
		case TYPE_IMPUT_USER:
			res.status(400).json({'response' : 0, 'error': error.message});
			break;
		case TYPE_PARSE:
			res.status(400).json({'response' : 0, 'error': error.message});
			break;
		case TYPE_CONNECT:
			res.status(400).json({'response' : 0, 'error': error.message});
			break;
		case TYPE_INTERNAL:
			res.status(500).json({'response' : 0, 'error': error.message});
			break;
		default:
			res.status(500).json({'response' : 0, 'error': error.message});
			break;
	}
}


exports.TYPE_LOGIC = TYPE_LOGIC;
exports.TYPE_IMPUT_USER = TYPE_IMPUT_USER;
exports.TYPE_PARSE = TYPE_PARSE;
exports.TYPE_CONNECT = TYPE_CONNECT;
exports.TYPE_INTERNAL = TYPE_INTERNAL;

exports.Error = Error;

exports.proccessAndSendErrors = proccessAndSendErrors;
