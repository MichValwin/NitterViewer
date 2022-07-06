const fs = require('fs');

const LOG_ARCHIVE_PREFIX = 'log';
const LOG_SUFIX = '.log';
const MAX_SIZE_PER_FILE = 24000000; //24MB
const MAX_LOGS = 7;

const LOG_LEVEL_ERROR = 0;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_VERBOSE = 3;
const LOG_LEVEL_DEBUG = 4;

const CURRENT_LOG_NAME = 'latest'; 

var logDirectory;
var currentLogLevel = LOG_LEVEL_INFO;
var currentLogfileName;

function fillLeftZero(str, lengthNeeded) {
	while(str.length < lengthNeeded)str = '0' + str;
	return str;
}

function getLogFileNames(logDirectory) {
	let arrFilesInLogDir = fs.readdirSync(logDirectory);

	// Count num of logs
	return arrFilesInLogDir.filter(filename => {
		if(filename.indexOf(LOG_SUFIX) != -1)return true;
	});
}

function removeOldestLog(logDirectory, arrLogFilenames) {
	let oldestFile = null;
	let oldestfileModificationTime = null;
	arrLogFilenames.forEach(filename => {
		let fileModificationTime = fs.statSync(logDirectory + filename).mtimeMs;
		if(oldestfileModificationTime == null || fileModificationTime < oldestfileModificationTime) {
			oldestFile = filename;
			oldestfileModificationTime = fileModificationTime;
		}
	});
	fs.unlinkSync(logDirectory + oldestFile);
}

function getLogFilesNamesContainsString(logDirectory, strCompare) {
	// Count repeated log files
	let arrFilesInLogDir = fs.readdirSync(logDirectory);
	return arrFilesInLogDir.filter(fileName => {
		if(fileName.indexOf(LOG_SUFIX) != -1 && fileName.indexOf(strCompare) != -1)return true;
	});
}

function getFirstNumberRepeatedLogFilenames(arrFilenamesRepeated) {
	let smallerNumber = MAX_LOGS;
	let arrOrderedExistingFileNumber = new Array(MAX_LOGS);
	arrOrderedExistingFileNumber.fill(false);

	arrFilenamesRepeated.forEach(filename => {
		let fileNum = parseInt(filename.match(/.(\d*?).log/)[1]);
		if(!isNaN(fileNum)) {
			arrOrderedExistingFileNumber[fileNum] = true;
		}
	});
	for(let i = 0; i < arrOrderedExistingFileNumber.length; i++) {
		if(arrOrderedExistingFileNumber[i] == false) {
			smallerNumber = i;
			break;
		}
	}

	return smallerNumber;
}

function renameLogForArchiving(logDirectory, filePathToRename) {
	let fileLastModifyDate = new Date(fs.statSync(filePathToRename).mtimeMs);
	let currentTimeFormated = fileLastModifyDate.getFullYear() + '-' + fillLeftZero(String(fileLastModifyDate.getMonth()), 2) + '-' + fillLeftZero(String(fileLastModifyDate.getDate()), 2);

	let fileNamesRepeated = getLogFilesNamesContainsString(logDirectory, currentTimeFormated);
	let smallerNumberNonExistent = getFirstNumberRepeatedLogFilenames(fileNamesRepeated);

	fs.renameSync(filePathToRename, logDirectory + LOG_ARCHIVE_PREFIX + currentTimeFormated + '.' + smallerNumberNonExistent + LOG_SUFIX);
}

exports.initLogger = function(logDir, logLevel) {
	logDirectory = logDir;
	currentLogLevel = logLevel;
	currentLogfileName = CURRENT_LOG_NAME + LOG_SUFIX;

	// Create directory if doesn't exist
	if (!fs.existsSync(logDirectory)){
		fs.mkdirSync(logDirectory);
	}

	let allLogsFileNames = getLogFileNames(logDirectory);

	// Remove oldest log file if we reached MAX_LOGS
	if(allLogsFileNames.length >= MAX_LOGS) {
		removeOldestLog(logDirectory, allLogsFileNames);
	}

	let currentLogPath = logDirectory + currentLogfileName;

	if(fs.existsSync(currentLogPath)) {
		// Rename it with last date update
		renameLogForArchiving(logDirectory, currentLogPath)
	}
	
	// Init new file
	fs.writeFileSync(currentLogPath, '');
}

exports.log = function(logType, strData) {
	if(logType <= currentLogLevel) {
		let currentDateTime = new Date().toISOString();
		let info = '[' + currentDateTime + ']';
		let strToLog =  info + ' ' + strData;

		let currentLogPath = logDirectory + currentLogfileName;

		console.log(strToLog);
		fs.writeFileSync(currentLogPath, strToLog + '\n', { flag: 'a' });
	}
}

exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
exports.LOG_LEVEL_VERBOSE = LOG_LEVEL_VERBOSE;
exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
