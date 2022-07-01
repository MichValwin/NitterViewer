(function(){
'use strict';

const promptModule = require('prompt-sync')();
const bcrypt = require('bcrypt');
var crypto = require('crypto');
const gameloop = require('node-gameloop');
const bodyParser = require('body-parser');
const session = require('express-session');
const compression = require('compression');
var express = require('express');
var expressApp = express();
var http = require('http').createServer(expressApp);

const configModule = require('./config.js');
const errorModule = require('./error.js');
const requestModule = require('./request.js');
const processNitterUserpage = require('./processNitterUserpage.js');

const path = require('path');
const fs = require('fs');
const process = require('process');

//Init web server
expressApp.disable('x-powered-by'); 	// Remove header x-powered-by
expressApp.use(compression());		// Use compression for all pages and files
expressApp.use(express.static('public_dist')); // Give access to public files
expressApp.use(bodyParser.json());
expressApp.use(session({
	secret: crypto.createHash('sha256').update(new Date().getTime() + 'CooookieSecret' + Math.random()).digest('hex'), // TODO: Replace by actual good cookie secret
	saveUninitialized: true,
	resave: true,
	cookie: {
		secure: false,
		httpOnly: false,
		maxAge: configModule.COOKIE_MAX_AGE
	}
}));

//--Verifications
function noSession(req, res, next){
    if(req.session.user === undefined){
        return next();
    }else{
        throw new errorModule.Error(errorModule.TYPE_IMPUT_USER, 'Already logged');
    }
}

function someSession(req, res, next){
    if(req.session.user !== undefined){
        return next();
    }else{
        throw new errorModule.Error(errorModule.TYPE_IMPUT_USER, 'Not logged');
    }
}

function anySession(req, res, next){
    return next();
}



//--Routes
// DEBUG MIDDLEWARE
if(configModule.DEBUG) {
	expressApp.use(function(req, res, next){
		console.log('Request url: ' + req.method + ' ' +  req.url);
		next();
	});
}

expressApp.post(configModule.API_ENDPOINT + '/logged', anySession, function (req, res) {
	if(req.session.user !== undefined) {
		console.log('User exists');
        res.json({'response': 1});
    }else{
		console.log('User not exists');
		res.json({'response': 0});
    }
});


expressApp.post(configModule.API_ENDPOINT + '/login', noSession, function (req, res) {
	const jsonData = req.body;
	const password = jsonData.password;

	// TODO MADE VERIFICATIONS WITH A JSON INPUT OR SOMETHING AUTOMATICALLY 
	if(password != null) {
		if(fs.existsSync(configModule.PASSWORD_FILE)){
			const savedPassword = fs.readFileSync(configModule.PASSWORD_FILE, {encoding: 'utf-8'});

			if(bcrypt.compareSync(password, savedPassword)) {
				req.session.user = true;
				res.json({'response': 1});
			}else{
				throw new errorModule.Error(errorModule.TYPE_IMPUT_USER, 'Password error');
			}
		}else{
			throw new errorModule.Error(errorModule.TYPE_LOGIC, 'Password file does not exist');
		}
	}else{
		throw new errorModule.Error(errorModule.TYPE_IMPUT_USER, 'No password sent');
	}
});

expressApp.get(configModule.API_ENDPOINT + '/lists', someSession, function (req, res) {
	if(nitterList != null && nitterList.length != 0) {
		let listNames = nitterList.map((list) => {return list.Name});
		res.json({'response': listNames});
	} else {
		throw new errorModule.Error(errorModule.TYPE_INTERNAL, 'No list loaded');
	}
});

expressApp.get(configModule.API_ENDPOINT + '/twitterList/:listName', someSession, function (req, res) {
	const listName = req.params.listName
	var twitterListToSend = null;

	if(listName != null) {
		for(let i = 0; i < nitterList.length; i++) {
			if(nitterList[i].Name == listName) {
				twitterListToSend = nitterList[i].data;
			}
		}

		if(twitterListToSend) {
			res.json({'response': twitterListToSend});
		}else{
			throw new errorModule.Error(errorModule.TYPE_LOGIC, 'No data');
		}
	}else{
		throw new errorModule.Error(errorModule.TYPE_LOGIC, 'No listname');
	}
});


// Need it to resolve strange names witn %2F and more
expressApp.get('/pic/*', someSession, function (req, res) {
	let filename = req.url.replace('/pic/', '');
	try {
		var pathToFile = path.resolve(configModule.DOWNLOAD_FOLDER + 'pic/', filename);
		if(fs.existsSync(pathToFile)) {
			res.sendFile(pathToFile);
		} else {
			let file404 = path.resolve('./resources/404.png');
			res.sendFile(file404);
		}
	}catch(err){
		throw new errorModule.Error(errorModule.TYPE_INTERNAL, err.message);
	}
	
});

// 404 handler
expressApp.use(function(req, res){
	console.log('Go to 404 handler');
	res.status(404).json({'response' : 0});
});


// Error handler middleware
expressApp.use(function(error, req, res, next) {
	errorModule.proccessAndSendErrors(error, res);
});

// Init server
const server = http.listen(configModule.PORT, function () {
	console.log('Server initialized on port: ' + configModule.PORT);
});

// ----------------------------------------------

// TODO make tests in other files
var nitterList;
var requestDataTimeStamp = new Date();

function initProgram(){
	// Check if there is a passwd, if not create it
	if(!fs.existsSync(configModule.PASSWORD_FILE)) {
		console.log('Looks like there is no password file');
		let passwd1 = promptModule('Please introduce the password now: ');
		let passwd2 = promptModule('Please introduce it again: ');

		while(passwd1 != passwd2) {
			console.log('Passwords are different, please introduce it again')
			passwd1 = promptModule('Please introduce the password now: ');
			passwd2 = promptModule('Please repeat the password: ');
		} 
		const hashedPasswd = bcrypt.hashSync(passwd1, configModule.SALT_ROUNDS);
		fs.writeFileSync(configModule.PASSWORD_FILE, hashedPasswd, {encoding: "utf8"});
	}

	// Check directories
	let picDownloadDirectory = configModule.DOWNLOAD_FOLDER + 'pic/';
	if (!fs.existsSync(picDownloadDirectory)){
		fs.mkdirSync(picDownloadDirectory, { recursive: true });
	}

	// Load twitter user list
	if(fs.existsSync(configModule.TWITTER_LISTS)) {
		const nitterListObj = JSON.parse(fs.readFileSync(configModule.TWITTER_LISTS));
		nitterList = nitterListObj.Lists;
	}else{
		// TODO CREATE template for file
		console.log(configModule.TWITTER_LISTS + ' file for nitter list does not exist, please create a file nitterList.json from the example');
		process.exit();
	}
	
	
	updateAllNitterUserData();

	// Init mainLoop
	gameloop.setGameLoop(mainLoop, 1000);
}

function updateAllNitterUserData() {
	// Lists
	for(let i = 0; i < nitterList.length; i++) {
		nitterList[i].data = new Array();

		// Users
		for(let j = 0; j < nitterList[i].Users.length; j++) {
			requestModule.doGETRequest(configModule.NITTER_WEBSITE + nitterList[i].Users[j]).then(
				function onFullfill(twitterPageContent){
					processNitterUserpage.parseTwitterUserPage(twitterPageContent, {"Pinned": nitterList[i].Pinned, "Retweets" : nitterList[i].Retweets}).then(
						function onFullfill(response){
							nitterList[i].data.push(response);
							requestDataTimeStamp = new Date();
						},
						function(error){
							console.log('Error while parsing ' + configModule.NITTER_WEBSITE + nitterList[i].Users[i]);
							console.log(error);
						}
					);
					
				}
			).catch(
				function onError(error){
					console.log('Error during request to page, error: ');
					console.log(error);
				}
			);
		}
	}
}



function mainLoop() {
	var timeMillisedonds = new Date().getTime();
	var timeSinceLastUpdate = timeMillisedonds - requestDataTimeStamp.getTime();

	//Update every X hours
	if(timeSinceLastUpdate > configModule.UPDATE_TIME) {
		updateAllNitterUserData();

		requestDataTimeStamp = new Date();
	}
}

initProgram();


//On close
process.on('SIGINT', function(){
	server.close();
	process.exit();
});
process.on('SIGTERM', function(){
	server.close();
	process.exit();
});

})();