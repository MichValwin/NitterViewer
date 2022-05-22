<script setup>
import Navbar from './components/navbarItem.vue'
import { ref } from 'vue'

import axios from 'axios'
import Globals from './globals.js'

var isLogged = ref('')
var inputPassword = ref('')

var errorMessage = ref('')
var nitterLists = ref('')

// Check if user is logged alredy
axios.post(Globals.SERVER_END_POINT + '/logged')
	.then(function(response) {
		isLogged.value = response.data.response === 1
		if(isLogged.value) {
			getNitterLists()
		}
	})
	.catch(function(error) {
		errorMessage.value = error
		isLogged.value = false
	})

function getNitterLists() {
	axios.get(Globals.SERVER_END_POINT + '/lists')
	.then(function(response) {
		nitterLists.value = response.data.response
		console.log(response.data.response)
	})
	.catch(function(error) {
		console.log(error)
	})
}

function onSubmitLogin() {
	errorMessage.value = ''

	axios.post(Globals.SERVER_END_POINT + '/login', {'password': inputPassword.value})
		.then(function(response) {
			console.log(response.data.response)
			if(response.data.response === 1) {
				isLogged.value = true
				getNitterLists()
			}
		})
		.catch(function(error) {
			if(error.response.data.error != null){
				errorMessage.value = error.response.data.error
			}else{
				errorMessage.value = error
			}
		})
}


</script>

<template>
	<header>
		<Navbar v-if="isLogged" :list="nitterLists"/>
	</header>
	
	<section>
		<div class="container-fluid h-100">
			<div class="row justify-content-md-center h-100">

				<div class="col-sm-12 no-padding" id="dark-main-content">
					<!--Login form-->
					<form v-if="!isLogged" @submit.prevent="onSubmitLogin" class="login-form">
						<h1 style="display:block;">Login to access</h1>
						<div class="flex-center">
							<input type="password" v-model="inputPassword" class="form-control">
							<input type="submit" value="Login" class="btn-lg btn-primary">
						</div>
						<p class="login-error">{{errorMessage}}</p>
					</form>

					<!--Content-->
					<div v-if="isLogged">
						<router-view />
					</div>
				</div>

			</div>
		</div>
	</section>
	
	
	<footer class="bg-dark"></footer>
</template>




<style>
	html, body{
		margin: 0;
		height: 100%;
	}

	#app{
		height: 100%;

		display: flex;
		flex-flow: column;
	}

	header{
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: auto;
	}

	section{
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: auto;
	}

	.no-padding {
		padding-left: 0 !important;
		padding-right: 0 !important;
	}

	#dark-main-content {
		background-color: #494F5C;
		height: 100%;

		color: #FFF;
	}

	.flex-center {
		display: flex;
		align-items: center;
        justify-content: center;
	}

	.flex-column-center {
		display: flex;
		flex-flow: column;
		align-items: center;
        justify-content: center;
	}

	.login-form {
		
	}

	.login-form > h1 {
		display: block;
		text-align: center;
	}

	.login-error {
		color: red;
		text-align: center;
		
		font-weight: bold;
		font-size: 2em;
	}
</style>
