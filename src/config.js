module.exports = {
    PORT: 8020,
	API_ENDPOINT: '/v1',
	LOG_DIRECTORY: './logs/',
	LOG_LEVEL: 3,

	DEBUG: false,
	PASSWORD_FILE: './password.txt',
	SALT_ROUNDS: 14,
		
	DOWNLOAD_FOLDER: './download/',

	SOCKS_PROXY: 'socks5://192.168.1.151:9050', // Ex: 'socks5://192.168.1.151:9050'

	NITTER_WEBSITE: 'https://twitter.censors.us/',
	TWITTER_LISTS: './nitterList.json',

	COOKIE_MAX_AGE: 1000 * 60 * 60 * 24 * 30, // 30 days
	UPDATE_TIME: 1000 * 60 * 60 * 6 // 6h
}