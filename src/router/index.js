import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProductsView from '@/views/ProductsView.vue'
import VirtualInvestView from '@/views/VirtualInvestView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import MyPageView from '@/views/MyPageView.vue'
import SignupView from '@/views/SignupView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: ProductsView },
    { path: '/virtual', name: 'virtual', component: VirtualInvestView },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/my', name: 'my', component: MyPageView },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
      meta: { hideBottomTabBar: true },
    },
  ],
})

export default router
