import { createRouter, createWebHistory } from 'vue-router'
import NitterListView from '../views/nitterListView.vue'

const routes = [
	{
		path: '/list',
		name: '',
		component: NitterListView,
		props: (route) => ({ name: route.query.name })
	}
]

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
})

export default router
