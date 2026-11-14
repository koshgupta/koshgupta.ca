import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    // Old routes from the previous site land on the matching pillar.
    { path: '/projects', redirect: { path: '/', hash: '#projects' } },
    { path: '/about', redirect: '/' },
    { path: '/home', redirect: '/' },
    { path: '/:catchAll(.*)', redirect: '/' },
  ],
})

export default router
