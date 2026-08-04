import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProductsView from '@/views/ProductsView.vue'
import VirtualInvestView from '@/views/VirtualInvestView.vue'
import VirtualInvestStartView from '@/views/VirtualInvestStartView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import MyPageView from '@/views/MyPageView.vue'
import SecurityDetailView from '@/views/SecurityDetailView.vue'
import GameView from '@/views/GameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: ProductsView },
    { path: '/virtual', name: 'virtual', component: VirtualInvestView },
    {
      path: '/virtual/start',
      name: 'virtual-start',
      component: VirtualInvestStartView,
      meta: { hideBottomTabBar: true },
    },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/my', name: 'my', component: MyPageView },
    { path: '/securities/:pk', name: 'security-detail', component: SecurityDetailView },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      meta: { hideBottomTabBar: true },
    },
  ],
})

export default router
