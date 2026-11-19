import '@fontsource-variable/mona-sans/wdth.css'
import './assets/main.css'

import { createApp } from 'vue'
import HomeView from './views/HomeView.vue'

// The site is one page. Old routes from the previous site land on it, /projects on the matching pillar
// (_redirects serves index.html for every path). Done before mounting, so HomeView sees the hash.
const path = location.pathname
if (path !== '/') history.replaceState(null, '', /^\/projects\/?$/i.test(path) ? '/#projects' : '/')

createApp(HomeView).mount('#app')
