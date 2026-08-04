import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProductsView from '@/views/ProductsView.vue'
import VirtualInvestView from '@/views/VirtualInvestView.vue'
import VirtualAssetsView from '@/views/VirtualAssetsView.vue'
import VirtualProductsView from '@/views/VirtualProductsView.vue'
import VirtualHistoryView from '@/views/VirtualHistoryView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import MyPageView from '@/views/MyPageView.vue'
import SecurityDetailView from '@/views/SecurityDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: ProductsView },
    {
      path: '/virtual',
      component: VirtualInvestView,
      children: [
        { path: '', redirect: { name: 'virtual-assets' } },
        { path: 'assets', name: 'virtual-assets', component: VirtualAssetsView },
        { path: 'products', name: 'virtual-products', component: VirtualProductsView },
        { path: 'history', name: 'virtual-history', component: VirtualHistoryView },
      ],
    },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/my', name: 'my', component: MyPageView },
    { path: '/securities/:pk', name: 'security-detail', component: SecurityDetailView },
  ],
})

export default router
