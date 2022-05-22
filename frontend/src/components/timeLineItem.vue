<script setup>
import { ref, defineProps, watch } from 'vue'
import axios from 'axios'

import Globals from '../globals.js'

const props = defineProps(['listName'])

var nitterTweets = ref('')

// Get all timeline
var getNitterTimeline = function(listName) {
	axios.get(Globals.SERVER_END_POINT + '/twitterList/' + listName)
		.then(function(response) {
			if(response.data.response !== 0) {
				console.log(response.data.response)
				nitterTweets.value = response.data.response
			}else{
				console.log(response.data.error)
			}
		})
		.catch(function(error) {
			console.log(error)
		})
}

getNitterTimeline(props.listName)

watch(props, () => {
	getNitterTimeline(props.listName)
})

</script>

<template>
	<div>
		<template v-for="(userTimeline, index) of nitterTweets" :key="index">
			<!--Profile card-->
			<div class="container-fluid profile-bg">
				<div class="row justify-content-md-center">
					<div class="col-sm-6">
						<a class="" :href="userTimeline.avatar" target="_blank">
							<img style="max-height:200px; width:auto;" :src="userTimeline.profile.avatarThumb">
						</a>
						<div class="profile-card-tabs-name">
							<a class="profile-card-fullname" href="" title="" ></a>
							<a class="profile-card-username" href="" title="" ></a>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="profile-bio" v-html="userTimeline.profile.bio"></div>
						<div class="profile-website" v-html="userTimeline.profile.website"></div>
						<div class="profile-joindate" v-html="userTimeline.profile.joinDate"></div>
						<div class="profile-card-extra-links">
							<ul class="profile-statlist">
								<li class="posts">
									<span class="profile-stat-header">Tweets</span>
									<span class="profile-stat-num">{{userTimeline.profile.tweets}}</span>
								</li>
								<li class="following">
									<span class="profile-stat-header">Following</span>
									<span class="profile-stat-num">{{userTimeline.profile.following}}</span>
								</li>
								<li class="followers">
									<span class="profile-stat-header">Followers</span>
									<span class="profile-stat-num">{{userTimeline.profile.followers}}</span>
								</li>
								<li class="likes">
									<span class="profile-stat-header">Likes</span>
									<span class="profile-stat-num">{{userTimeline.profile.likes}}</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<!--Content-->
			<div class="timeline" v-html="userTimeline.entireTimeline"></div>

			<br>
		</template>
	</div>
</template>

<style>
.profile-bg{
	background-color: #080808;
}

.no-padding {
	padding-left: 0 !important;
	padding-right: 0 !important;
}

</style>
