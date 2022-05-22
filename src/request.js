const axios = require('axios');
const https = require('https');
const configModule = require('./config.js');

var httpsAgent;

// Use proxy or normal connection
if(configModule.SOCKS_PROXY) {
	console.log('Using SOCKS proxy');
	let {SocksProxyAgent} = require('socks-proxy-agent')
	httpsAgent =  new SocksProxyAgent(configModule.SOCKS_PROXY);
} else {
	httpsAgent = https.Agent({});
}


exports.doGETRequest = async function(urlString) {
	let response = await axios.request({
		method: 'GET',
		url: urlString,
		httpsAgent: httpsAgent
	});

	return response;
}

exports.downloadStream = async function(urlString) {
	let response = await axios.request({
		method: 'GET',
		url: urlString,
		httpsAgent: httpsAgent,

		responseType: 'stream'
	});

	return response;
}