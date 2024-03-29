const axios = require('axios');
const https = require('https');
const configModule = require('./config.js');
const logModule = require('./logger.js');

var httpsAgent;

// Use proxy or normal connection
if(configModule.SOCKS_PROXY) {
	logModule.log(logModule.LOG_LEVEL_INFO, 'Using SOCKS proxy');

	let {SocksProxyAgent} = require('socks-proxy-agent');
	httpsAgent =  new SocksProxyAgent(configModule.SOCKS_PROXY);
} else {
	httpsAgent = https.Agent({});
}


exports.doGETRequest = function(urlString) {
	return axios.request({
		method: 'GET',
		url: urlString,
		httpsAgent: httpsAgent,
		timeout: 30000
	});
}

exports.downloadStream = function(urlString) {
	return axios.request({
		method: 'GET',
		url: urlString,
		httpsAgent: httpsAgent,

		responseType: 'stream',
		timeout: 30000
	});
}