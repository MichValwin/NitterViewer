const HTMLParser = require('node-html-parser');
const path = require('path');
const fs = require('fs');
const requestModule = require('./request.js');
const configModule = require('./config.js');
const logModule = require('./logger.js');

function isTweetPinned(tweet) {
	let pinnedDiv = tweet.querySelector('.pinned');
	if(pinnedDiv) {
		return true;
	} else {
		return false;
	}
}

function isTweetRetweet(tweet) {
	let iconRetweet = tweet.querySelector('.retweet-header');
	if(iconRetweet) {
		return true;
	} else {
		return false;
	}
}

function getTimeMillisFromTweet(tweet) {
	let tweetDateString = tweet.querySelector('.tweet-date').firstChild.getAttribute('title');
	let tweetDate = new Date(tweetDateString.split("·")[0]);
	return tweetDate.getTime();
}


async function checkFileExistAndDownload(filenamePath) {
	const fileName = path.basename(filenamePath); // file without /pic path
	const localFilePath = path.resolve(configModule.DOWNLOAD_FOLDER + 'pic/', fileName);
	
	if(!fs.existsSync(localFilePath)) {
		logModule.log(logModule.LOG_LEVEL_DEBUG, 'Downloading file: ' + configModule.NITTER_WEBSITE + filenamePath);
		const responseBuffer = await requestModule.downloadStream(configModule.NITTER_WEBSITE + filenamePath);
		await responseBuffer.data.pipe(fs.createWriteStream(localFilePath));

		return true;
	}else{
		logModule.log(logModule.LOG_LEVEL_DEBUG, 'File: ' + localFilePath + ' already exist');
		return false;
	}
}

function replaceForbiddenCharsAndStrings(str) {
	const allScriptText = new RegExp('< */? *script *>', 'gmi'); // Al types of <script> and </script>
	return str.replaceAll(allScriptText, '');
}


function getProfileInfo(parsedNitterUserPage) {
	// Profile card
	var profileInfo = {avatarThumb: '', avatar: '', fullName: '', username: '', bio: '', website: '', joinDate: '', tweets: '', following: '', followers: '', likes: '', isProtected: false};

	let profileCardAvatar = parsedNitterUserPage.querySelector('.profile-card-avatar');
	profileInfo.avatar = replaceForbiddenCharsAndStrings(profileCardAvatar.getAttribute('href'));
	profileInfo.avatarThumb = replaceForbiddenCharsAndStrings(profileCardAvatar.firstChild.getAttribute('src'));

	let profileCardFullname = parsedNitterUserPage.querySelector('.profile-card-fullname');
	profileInfo.fullName = replaceForbiddenCharsAndStrings(profileCardFullname.innerText);

	let profileCardUsername = parsedNitterUserPage.querySelector('.profile-card-username');
	profileInfo.username = replaceForbiddenCharsAndStrings(profileCardUsername.innerText);

	let profileBio = parsedNitterUserPage.querySelector('.profile-bio');
	if(profileBio != null) {
		profileInfo.bio = replaceForbiddenCharsAndStrings(profileBio.innerHTML);
	}else{
		profileInfo.bio = null;
	}

	let profileCardWebsite = parsedNitterUserPage.querySelector('.profile-website');
	if(profileCardWebsite)profileInfo.website = replaceForbiddenCharsAndStrings(profileCardWebsite.innerHTML);

	let profileJoinDate = parsedNitterUserPage.querySelector('.profile-joindate');
	if(profileJoinDate)profileInfo.joinDate = replaceForbiddenCharsAndStrings(profileJoinDate.innerHTML);

	let profileStatsTweets = parsedNitterUserPage.querySelector('.posts .profile-stat-num');
	if(profileStatsTweets)profileInfo.tweets = replaceForbiddenCharsAndStrings(profileStatsTweets.innerText);

	let profileStatsFollowing = parsedNitterUserPage.querySelector('.following .profile-stat-num');
	if(profileStatsFollowing)profileInfo.following = replaceForbiddenCharsAndStrings(profileStatsFollowing.innerText);

	let profileStatsFollowers = parsedNitterUserPage.querySelector('.followers .profile-stat-num');
	if(profileStatsFollowers)profileInfo.followers = replaceForbiddenCharsAndStrings(profileStatsFollowers.innerText);

	let profileStatsLikes = parsedNitterUserPage.querySelector('.likes .profile-stat-num');
	if(profileStatsLikes)profileInfo.likes = replaceForbiddenCharsAndStrings(profileStatsLikes.innerText);

	return profileInfo;
}

async function downloadImagesTimeline(parsedTimeline) {
	// Get all the src files needed
	var imagesToDownload = [];
	let allsrcElements = parsedTimeline.querySelectorAll('[src]');
	imagesToDownload = allsrcElements.map((elem) => elem.getAttribute('src'));
	// Download images
	// TODO await promise all for all images 
	for(let i = 0; i < imagesToDownload.length; i++) {
		try {
			await checkFileExistAndDownload(imagesToDownload[i]);
		} catch(error) {
			logModule.log(logModule.LOG_LEVEL_ERROR, 'Error Downloading file: ' + imagesToDownload[i]);
			logModule.log(logModule.LOG_LEVEL_ERROR, error.stack);
		}
	}
}

async function downloadVideosTimeline(parsedTimeline) {
	//TODO Get all data-url (for videos)
	var videosToDownload = [];
	let alldataurlElements = parsedTimeline.querySelectorAll('[data-url]');
	videosToDownload = alldataurlElements.map((elem) => elem.getAttribute('data-url'));
	for(let i = 0; i < videosToDownload.length; i++) {
		try {
			//await checkFileExistAndDownload(imagesToDownload[i]);
		} catch(error) {
			logModule.log(logModule.LOG_LEVEL_ERROR, 'Error Downloading file: ' + videosToDownload[i]);
			logModule.log(logModule.LOG_LEVEL_ERROR, error.stack);
		}
	}
}

function proccessTweets(parsedTimeline) {
	let tweetsDivElements = parsedTimeline.querySelectorAll('.timeline-item');
	
	let tweetsProcessed = tweetsDivElements.map(tweetElement => {
		let isPinned = isTweetPinned(tweetElement);
		let isRetweet = isTweetRetweet(tweetElement);
		let dateMillis = getTimeMillisFromTweet(tweetElement);

		let isOnThread = tweetElement.parentNode.classList._set.has('thread-line');
		
		let tweetHTMLProcessed = tweetElement.outerHTML;
		tweetHTMLProcessed = tweetHTMLProcessed.replaceAll('href="', 'href="' + configModule.NITTER_WEBSITE);
		tweetHTMLProcessed = tweetHTMLProcessed.replaceAll('poster="', 'poster="' + configModule.NITTER_WEBSITE);
		tweetHTMLProcessed = tweetHTMLProcessed.replaceAll('data-url="', 'data-url="' + configModule.NITTER_WEBSITE);
		tweetHTMLProcessed = replaceForbiddenCharsAndStrings(tweetHTMLProcessed);

		return {'tweet': tweetHTMLProcessed, 'isPinned': isPinned, 'isRetweet': isRetweet, 'date': dateMillis, 'isOnThread': isOnThread};
	});
	
	return tweetsProcessed;
}


exports.processNitterUserHtmlPage = async function(axiosResponse) {
	var root = HTMLParser.parse(axiosResponse.data);

	// Process protected or private profiles
	let protectedTitle = root.querySelector('.timeline-protected');
	var profileInfo = getProfileInfo(root);
	
	if(protectedTitle != null) {
		logModule.log(logModule.LOG_LEVEL_INFO, 'Profile of: ' + profileInfo.username + ' is protected');
		return {'profile' : profileInfo, 'userPageHtml': null};
	}

	// Download images and video from timeline
	var entireTimeline = root.querySelector('.timeline');

	await downloadImagesTimeline(entireTimeline);
	await downloadVideosTimeline(entireTimeline);

	let tweets = proccessTweets(entireTimeline);
	
	return {'profile' : profileInfo, 'tweets': tweets, 'userPageHtml': axiosResponse.data};
}

exports.filterTweets = function(tweets, options) {
	// Filter Pinned
	if(!options.pinned) {
		tweets = tweets.filter(tweet => {
			return !tweet.isPinned;
		});
	}

	// Filter retweets
	if(!options.retweets) {
		tweets = tweets.filter(tweet => {
			return !tweet.isRetweet;
		});
	}

	// Filter 93 days old tweets 
	tweets = tweets.filter((tweet, index) => {
		if(index > 6) {
			let elapsedDays = (new Date().getTime() - tweet.dateMillis) / (1000 * 60 * 60 * 24);
			if(elapsedDays > 93)return false;
		}
		return true;
	});

	return tweets;
}