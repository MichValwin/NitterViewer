<script setup>
import { defineProps } from "vue";

defineProps(['list'])

</script>

<template>
	<nav class="navbar navbar-expand-sm bg-dark navbar-dark">
		<div class="container-fluid ">

			<!-- Toggler/collapsibe Button -->
			<button class="navbar-toggler w-100" type="button" data-bs-toggle="collapse" data-bs-target="#collapsible-navbar">
				<span class="navbar-toggler-icon"></span>
			</button>

			<!-- Navbar in collapse container -->
			<div class="collapse navbar-collapse show" id="collapsible-navbar">
				
				<!-- Links -->
				<ul class="navbar-nav me-auto">
					<template v-for="(listName, index) of list" :key="index">
						<li class="nav-item px-3">
							<router-link :to="`/list?name=` + listName" class="nav-link">{{listName}}</router-link>
						</li>
					</template>
		
				</ul>
			</div>

		</div>
	</nav>
</template>

<style>
	.navbar{
		padding-bottom: 5px;
		line-height: 1.6em;
	}

	.navbar .nav-link {
		font-weight: bold;
		color: rgba(255,255,255,0.55) !important;
	}

	.navbar .nav-link:hover{
		color: rgba(255,255,255,1.0) !important;
		transition: 0.4s;
	}

	/*Center text on collapse*/
	.navbar .navbar-collapse {
		text-align: center;
	}
	
	.navbar .darkmode-label {
		color: white;
	}
</style>
