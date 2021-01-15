import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import VideoList from '../views/VideoList.vue'
import CameraConfig from '../views/CameraConfig.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/cameraconfig',
    name: 'CameraConfig',
    component: CameraConfig
  },
  {
    path: '/videolist',
    name: 'VideoList',
    component: VideoList
  },
  {
    path: '/',
    name: 'Home',
    redirect: '/videolist'
  }
]

const router = new VueRouter({
  routes
})

export default router
