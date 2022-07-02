const fs = require('fs');

const LOGGIN_FILE_NAME = 'log';
const MAX_SIZE_PER_FILE = 24000000; //24MB

const LOG_LEVEL_ERROR = 0;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_VERBOSE = 3;
const LOG_LEVEL_DEBUG = 4;

var currentLogfileName;
var logDirectory;
var currentLogLevel = LOG_LEVEL_INFO;

exports.initLogger = function(logDir, logLevel) {
	logDirectory = logDir;
	currentLogLevel = logLevel;

	// Create directory if doesn't exist
	if (!fs.existsSync(logDirectory)){
		fs.mkdirSync(logDirectory);
	}

	// Get all files in dir and count log files
	let filesInLogDir = fs.readdirSync(logDirectory);
	let logFiles = filesInLogDir.filter(fileName => {
		if(fileName.indexOf(LOGGIN_FILE_NAME) != -1)return true;
	});
	let numLogs = logFiles.length;

	// Init new file
	currentLogfileName = LOGGIN_FILE_NAME + String(numLogs) + '.log';
	fs.writeFileSync(logDirectory + currentLogfileName, '');
}

exports.log = function(logType, strData) {
	if(logType <= currentLogLevel) {
		let currentDateTime = new Date().toISOString();
		let info = '[' + currentDateTime + ']';
		let strToLog =  info + ' ' + strData;

		console.log(strToLog);
		fs.writeFileSync(logDirectory + currentLogfileName, strToLog + '\n', { flag: 'a' });
	}
}

exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
exports.LOG_LEVEL_VERBOSE = LOG_LEVEL_VERBOSE;
exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
