const HTMLParser = require('node-html-parser');
const path = require('path');
const fs = require('fs');
const requestModule = require('./request.js');
const configModule = require('./config.js');

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
		console.log('Downloading file: ' + 'https://nitter.privacy.com.de' + filenamePath);
		const responseBuffer = await requestModule.downloadStream('https://nitter.privacy.com.de' + filenamePath);
		const onSuccessFileWrite = await responseBuffer.data.pipe(fs.createWriteStream(localFilePath));


		return true;
	}else{
		console.log('File: ' + localFilePath + " already exist");
		return false;
	}
}

function replaceForbiddenCharsAndStrings(str) {
	const allScriptText = new RegExp('< *\/? *script *>', 'gmi'); // Al types of <script> and </script>
	return str.replaceAll(allScriptText, '');
}

exports.parseTwitterUserPage = async function(axiosResponse, options) {
	//console.log(axiosResponse.data);
	var root = HTMLParser.parse(axiosResponse.data);

	// Profile card
	var profileInfo = {avatarThumb: '', avatar: '', fullName: '', username: '', bio: '', website: '', joinDate: '', tweets: '', following: '', followers: '', likes: ''};		

	let profileCardAvatar = root.querySelector('.profile-card-avatar');
	profileInfo.avatar = replaceForbiddenCharsAndStrings(profileCardAvatar.getAttribute('href'));
	profileInfo.avatarThumb = replaceForbiddenCharsAndStrings(profileCardAvatar.firstChild.getAttribute('src'));

	try {
		await checkFileExistAndDownload(profileInfo.avatarThumb);
	} catch(error) {
		console.log('Error Downloading file: ' + profileInfo.avatarThumb);
		console.log(error);
	}

	let profileCardFullname = root.querySelector('.profile-card-fullname');
	profileInfo.fullName = replaceForbiddenCharsAndStrings(profileCardFullname.innerText);

	let profileCardUsername = root.querySelector('.profile-card-username');
	profileInfo.username = replaceForbiddenCharsAndStrings(profileCardUsername.innerText);

	let profileBio = root.querySelector('.profile-bio');
	if(profileBio != null) {
		profileInfo.bio = replaceForbiddenCharsAndStrings(profileBio.innerHTML);
	}else{
		profileInfo.bio = null;
	}

	let profileCardWebsite = root.querySelector('.profile-website');
	if(profileCardWebsite)profileInfo.website = replaceForbiddenCharsAndStrings(profileCardWebsite.innerHTML);

	let profileJoinDate = root.querySelector('.profile-joindate');
	if(profileJoinDate)profileInfo.joinDate = replaceForbiddenCharsAndStrings(profileJoinDate.innerHTML);

	let profileStatsTweets = root.querySelector('.posts .profile-stat-num');
	if(profileStatsTweets)profileInfo.tweets = replaceForbiddenCharsAndStrings(profileStatsTweets.innerText);

	let profileStatsFollowing = root.querySelector('.following .profile-stat-num');
	if(profileStatsFollowing)profileInfo.following = replaceForbiddenCharsAndStrings(profileStatsFollowing.innerText);

	let profileStatsFollowers = root.querySelector('.followers .profile-stat-num');
	if(profileStatsFollowers)profileInfo.followers = replaceForbiddenCharsAndStrings(profileStatsFollowers.innerText);

	let profileStatsLikes = root.querySelector('.likes .profile-stat-num');
	if(profileStatsLikes)profileInfo.likes = replaceForbiddenCharsAndStrings(profileStatsLikes.innerText);

	// ----- Timeline -----
	var timeline = [];
	var entireTimeline = root.querySelector('.timeline');

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
	console.log('Tweets to delete: ' + tweetsToDelete.size);
	tweetsToDelete.forEach(function(tweetToBeDeleted) {
		entireTimeline.removeChild(tweetToBeDeleted);
	});



	// Get all the src files needed
	var imagesToDownload = [];
	let allsrcElememnts = entireTimeline.querySelectorAll('[src]');
	imagesToDownload = allsrcElememnts.map((elem) => elem.getAttribute('src'));
	// Download images
	// TODO await promise all for all images 
	for(let i = 0; i < imagesToDownload.length; i++) {
		try {
			await checkFileExistAndDownload(imagesToDownload[i]);
		} catch(error) {
			console.log('Error Downloading file: ' + imagesToDownload[i]);
			console.log(error);
		}
	}

	entireTimeline = entireTimeline.innerHTML;
	entireTimeline = entireTimeline.replaceAll('href="', 'href="https://twitter.censors.us');
	entireTimeline = entireTimeline.replaceAll('poster="', 'poster="https://twitter.censors.us');
	entireTimeline = entireTimeline.replaceAll('data-url="', 'data-url="https://twitter.censors.us');
	entireTimeline = replaceForbiddenCharsAndStrings(entireTimeline);

	/* TODO Some day some day...
	var timelineElements = root.querySelectorAll('.timeline-item');
	for(let i = 0; i < timelineElements.length; i++) {
		// Header
		let tweetLink = timelineElements[i].querySelector('.tweet-link').getAttribute('href');

		let retweet = timelineElements[i].querySelector('.retweet-header');
		if(retweet != null){
			retweet = true;
		}else{
			retweet = false;
		}

		let tweetAvatar = timelineElements[i].querySelector('.tweet-avatar').firstChild.getAttribute('src');

		let fullnameAndUsername = timelineElements[i].querySelector('.fullname-and-username');
		let fullname = fullnameAndUsername.firstChild.innerText;
		let username = fullnameAndUsername.childNodes[1].innerText;

		// Body
		let timelineItemHTML = timelineElements[i].innerHTML;
		timelineItemHTML = timelineItemHTML.replaceAll('href="', 'href="https://twitter.censors.us');
		timelineItemHTML = timelineItemHTML.replaceAll('src="', 'src="https://twitter.censors.us');
		timelineItemHTML = timelineItemHTML.replaceAll('poster="', 'poster="https://twitter.censors.us');
		timelineItemHTML = timelineItemHTML.replaceAll('data-url="', 'data-url="https://twitter.censors.us');

		timelineItemHTML = timelineItemHTML.replaceAll('<script>"', '');
		timelineItemHTML = timelineItemHTML.replaceAll('</script>"', '');

		let tweetContent =  timelineElements[i].querySelector('.tweet-content').innerText;
		let attachments = timelineElements[i].querySelector('.attachments');
		if(attachments != null) {
			
			var innerHTMLAttachments = attachments.innerHTML.replaceAll('href="', 'href="https://twitter.censors.us');
			innerHTMLAttachments = innerHTMLAttachments.replaceAll('src="', 'src="https://twitter.censors.us');
			innerHTMLAttachments = innerHTMLAttachments.replaceAll('poster="', 'poster="https://twitter.censors.us');
			innerHTMLAttachments = innerHTMLAttachments.replaceAll('data-url="', 'data-url="https://twitter.censors.us');
			attachments = innerHTMLAttachments;
		}

		timeline.push({'timelineItemHTML': timelineItemHTML,  'tweetLink': tweetLink, 'retweet': retweet, 'tweetAvatar': tweetAvatar, 'fullname': fullname, 'username': username, 
			'tweetContent': tweetContent, 'attachments': attachments});
	}
	*/
	
	return {'profile' : profileInfo, 'timeline': timeline, 'entireTimeline': entireTimeline};
}