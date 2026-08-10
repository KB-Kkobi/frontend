import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProductsView from '@/views/ProductsView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import ProductHoldingsView from '@/views/ProductHoldingsView.vue'
import ProductHoldingDetailView from '@/views/ProductHoldingDetailView.vue'
import ProductSubscriptionView from '@/views/ProductSubscriptionView.vue'
import VirtualInvestView from '@/views/VirtualInvestView.vue'
import VirtualAssetsView from '@/views/VirtualAssetsView.vue'
import VirtualProductsView from '@/views/VirtualProductsView.vue'
import VirtualHistoryView from '@/views/VirtualHistoryView.vue'
import VirtualInvestStartView from '@/views/VirtualInvestStartView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import MyPageView from '@/views/MyPageView.vue'
import SecurityDetailView from '@/views/SecurityDetailView.vue'
import GameIntroductionView from '@/views/GameIntroductionView.vue'
import GameView from '@/views/GameView.vue'
import SignUpView from '@/views/SignUpView.vue'
import LoginView from '@/views/LoginView.vue'
import PasswordResetView from '@/views/PasswordResetView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: ProductsView },
    {
      path: '/products/:productType/:productId/subscribe',
      name: 'product-subscribe',
      component: ProductSubscriptionView,
    },
    {
      path: '/products/:productType/:productId',
      name: 'product-detail',
      component: ProductDetailView,
    },
    {
      path: '/virtual',
      component: VirtualInvestView,
      children: [
        { path: '', redirect: { name: 'virtual-assets' } },
        {
          path: 'assets',
          name: 'virtual-assets',
          component: VirtualAssetsView,
        },
        {
          path: 'products',
          name: 'virtual-products',
          component: VirtualProductsView,
        },
        {
          path: 'history',
          name: 'virtual-history',
          component: VirtualHistoryView,
        },
        {
          path: 'holdings',
          name: 'product-holdings',
          component: ProductHoldingsView,
        },
        {
          path: 'holdings/:holdingProductId',
          name: 'product-holding-detail',
          component: ProductHoldingDetailView,
        },
      ],
    },
    {
      path: '/virtual/start',
      name: 'virtual-start',
      component: VirtualInvestStartView,
    },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/my', name: 'my', component: MyPageView },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { hideBottomTabBar: true },
    },
    {
      path: '/password-reset',
      name: 'password-reset',
      component: PasswordResetView,
      meta: { hideBottomTabBar: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignUpView,
      meta: { hideBottomTabBar: true },
    },
    {
      path: '/securities/:pk',
      name: 'security-detail',
      component: SecurityDetailView,
    },
    {
      path: '/game/introduction',
      name: 'game-introduction',
      component: GameIntroductionView,
      meta: { hideBottomTabBar: true },
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      meta: { hideBottomTabBar: true },
    },
  ],
})

export default router
