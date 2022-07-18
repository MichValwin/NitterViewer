const HTMLParser = require('node-html-parser');
const path = require('path');
const fs = require('fs');
const requestModule = require('./request.js');
const configModule = require('./config.js');
const logModule = require('./logger.js');

function isTweetTooOld(tweet) {
	let tweetDateString = tweet.querySelector('.tweet-date').firstChild.getAttribute('title');
	let tweetDate = new Date(tweetDateString.split("·")[0]);

	let elapsedDays = (new Date().getTime() - tweetDate.getTime()) / (1000 * 60 * 60 * 24);
	if(elapsedDays > 93) {
		return true;
	} else {
		return false;
	}
}

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


async function checkFileExistAndDownload(filenamePath) {
	const fileName = path.basename(filenamePath); // file without /pic path
	const localFilePath = path.resolve(configModule.DOWNLOAD_FOLDER + 'pic/', fileName);
	
	if(!fs.existsSync(localFilePath)) {
		logModule.log(logModule.LOG_LEVEL_DEBUG, 'Downloading file: ' + 'https://nitter.privacy.com.de' + filenamePath);
		const responseBuffer = await requestModule.downloadStream('https://nitter.privacy.com.de' + filenamePath);
		const onSuccessFileWrite = await responseBuffer.data.pipe(fs.createWriteStream(localFilePath));

		return true;
	}else{
		logModule.log(logModule.LOG_LEVEL_DEBUG, 'File: ' + localFilePath + ' already exist');
		return false;
	}
}

function replaceForbiddenCharsAndStrings(str) {
	const allScriptText = new RegExp('< *\/? *script *>', 'gmi'); // Al types of <script> and </script>
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

exports.processNitterUserHtmlPage = async function(axiosResponse) {
	var root = HTMLParser.parse(axiosResponse.data);

	// Process protected or private profiles
	let protectedTitle = root.querySelector('.timeline-protected');
	if(protectedTitle != null) {
		logModule.log(logModule.LOG_LEVEL_INFO, 'Profile of: ' + profileInfo.username + ' is protected');
		return {'profile' : profileInfo, 'userPageHtml': null};
	}

	var profileInfo = getProfileInfo(root);

	// Download images and video from timeline
	var entireTimeline = root.querySelector('.timeline');

	await downloadImagesTimeline(entireTimeline);
	await downloadVideosTimeline(entireTimeline);
	
	return {'profile' : profileInfo, 'userPageHtml': axiosResponse.data};
}


exports.filterTwitterUserPage = function(htmlNitterUserPage, options) {
try{
	var rootDoc = HTMLParser.parse(htmlNitterUserPage);
	var entireTimeline = rootDoc.querySelector('.timeline');

	// Remove top-ref and show-more divs
	entireTimeline.removeChild(entireTimeline.querySelector('.top-ref'));
	entireTimeline.removeChild(entireTimeline.querySelector('.show-more'));

	// --------- Filter ----------
	let tweetsToDelete = new Set();
	let tweets = entireTimeline.querySelectorAll('.timeline-item');
	tweets.concat(entireTimeline.querySelectorAll('.thread-line'));

	// Get Pinned
	if(!options.Pinned) {
		let tweetsPinned = tweets.filter(isTweetPinned);
		for(let i = 0; i < tweetsPinned.length; i++) {
			tweetsToDelete.add(tweetsPinned[i]);
		}
	}

	// get retweets
	if(!options.Retweets) {
		let retweets = tweets.filter(isTweetRetweet);
		for(let i = 0; i < retweets.length; i++) {
			tweetsToDelete.add(retweets[i]);
		}
	}

	// Get 93 days old tweets if timeline has more than 10 tweets
	let timeLineItems = entireTimeline.querySelectorAll('.timeline-item:nth-child(n+6)');
	let threadLines = entireTimeline.querySelectorAll('.thread-line:nth-child(n+6)');
	let timeLineItemsToDelete = timeLineItems.filter(isTweetTooOld);
	let threadLinesToDelete = threadLines.filter(isTweetTooOld);

	for(let i = 0; i < timeLineItemsToDelete.length; i++) {
		tweetsToDelete.add(timeLineItemsToDelete[i])
	}
	for(let i = 0; i < threadLinesToDelete.length; i++) {
		tweetsToDelete.add(threadLinesToDelete[i])
	}

	// Delete tweets marked
	logModule.log(logModule.LOG_LEVEL_DEBUG, 'Tweets to delete: ' + tweetsToDelete.size);
	tweetsToDelete.forEach(function(tweetToBeDeleted) {
		entireTimeline.removeChild(tweetToBeDeleted);
	});

	let strProccessEntireTimelineHTML = entireTimeline.innerHTML;
	strProccessEntireTimelineHTML = strProccessEntireTimelineHTML.replaceAll('href="', 'href="https://twitter.censors.us');
	strProccessEntireTimelineHTML = strProccessEntireTimelineHTML.replaceAll('poster="', 'poster="https://twitter.censors.us');
	strProccessEntireTimelineHTML = strProccessEntireTimelineHTML.replaceAll('data-url="', 'data-url="https://twitter.censors.us');
	strProccessEntireTimelineHTML = replaceForbiddenCharsAndStrings(strProccessEntireTimelineHTML);
	return strProccessEntireTimelineHTML;
}catch(e){
	console.log(e);
	throw e;
}
	
}