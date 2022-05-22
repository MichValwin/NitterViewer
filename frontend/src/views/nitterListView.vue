<script setup>
import { defineProps } from "vue";
import TimeLineItem from '../components/timeLineItem.vue'

const props = defineProps(['name'])

</script>

<template>
	<h1>List: {{props.name}}</h1>
	<TimeLineItem :listName="props.name"/>
</template>

<style>

</style>
