const fs = require('fs');

const LOGGIN_FILE_NAME = 'log';
const MAX_SIZE_PER_FILE = 24000000; //24MB
const MAX_LOGS = 4;

const LOG_LEVEL_ERROR = 0;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_VERBOSE = 3;
const LOG_LEVEL_DEBUG = 4;

var currentLogfileName;
var logDirectory;
var currentLogLevel = LOG_LEVEL_INFO;

function fillLeftZero(str, lengthNeeded) {
	while(str.length < lengthNeeded)str = '0' + str;
	return str;
}

exports.initLogger = function(logDir, logLevel) {
	logDirectory = logDir;
	currentLogLevel = logLevel;

	// Create directory if doesn't exist
	if (!fs.existsSync(logDirectory)){
		fs.mkdirSync(logDirectory);
	}

	let currentTime = new Date();
	let currentTimeFormated = currentTime.getFullYear() + '-' + fillLeftZero(String(currentTime.getMonth()), 2) + '-' + fillLeftZero(String(currentTime.getDate()), 2);

	let arrFilesInLogDir = fs.readdirSync(logDirectory);

	// Count num of logs
	let allLogsFileNames = arrFilesInLogDir.filter(fileName => {
		if(fileName.indexOf('.log') != -1)return true;
	});
	let numLogs = allLogsFileNames.length;

	// Remove one old file
	if(numLogs >= MAX_LOGS) {
		let oldestFile = null;
		let oldestfileModificationTime = null;
		allLogsFileNames.forEach(file => {
			let fileModificationTime = fs.statSync(logDirectory + file).mtimeMs;
			if(oldestfileModificationTime == null || fileModificationTime < oldestfileModificationTime) {
				oldestFile = file;
				oldestfileModificationTime = fileModificationTime;
			}
		});
		fs.unlinkSync(logDirectory + oldestFile);
	}

	// Count repeated log files
	arrFilesInLogDir = fs.readdirSync(logDirectory);
	allLogsFileNames = arrFilesInLogDir.filter(fileName => {
		if(fileName.indexOf('.log') != -1)return true;
	});
	let repeatedTodayLogFiles = allLogsFileNames.filter(fileName => {
		if(fileName.indexOf(LOGGIN_FILE_NAME + currentTimeFormated) != -1)return true;
	});

	// Get first number
	let smallerAvalibleFileNum = 0;
	let arrExistingNum = new Array(MAX_LOGS + 1);
	arrExistingNum.fill(false);
	repeatedTodayLogFiles.forEach(fileName => {
		let fileNum = parseInt(fileName.match(/.(\d*?).log/)[1]);
		if(!isNaN(fileNum)) {
			arrExistingNum[fileNum] = true;
		}
	});
	for(let i = 0; i < arrExistingNum.length; i++) {
		if(!arrExistingNum[i]) {
			smallerAvalibleFileNum = i;
			break;
		}
	}

	currentLogfileName = LOGGIN_FILE_NAME + currentTimeFormated + '.' +  smallerAvalibleFileNum + '.log';
	
	// Init new file
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
