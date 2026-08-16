import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { readGameStartSession } from '@/utils/gameStorage'
import HomeView from '@/views/HomeView.vue'
import ProductsView from '@/views/ProductsView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import ProductHoldingsView from '@/views/ProductHoldingsView.vue'
import ProductHoldingDetailView from '@/views/ProductHoldingDetailView.vue'
import ProductTerminationView from '@/views/ProductTerminationView.vue'
import ProductSubscriptionView from '@/views/ProductSubscriptionView.vue'
import VirtualInvestView from '@/views/VirtualInvestView.vue'
import VirtualAssetsView from '@/views/VirtualAssetsView.vue'
import VirtualProductsView from '@/views/VirtualProductsView.vue'
import VirtualHistoryView from '@/views/VirtualHistoryView.vue'
import VirtualInvestStartView from '@/views/VirtualInvestStartView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import MyPageView from '@/views/MyPageView.vue'
import MyProfileView from '@/views/MyProfileView.vue'
import FriendManagementView from '@/views/FriendManagementView.vue'
import SecurityDetailView from '@/views/SecurityDetailView.vue'
import GameAllocationView from '@/views/GameAllocationView.vue'
import GameIntroductionView from '@/views/GameIntroductionView.vue'
import GameTutorialView from '@/views/GameTutorialView.vue'
import GameStartView from '@/views/GameStartView.vue'
import GameView from '@/views/GameView.vue'
import AssessmentResultView from '@/views/AssessmentResultView.vue'
import PersonaTypesView from '@/views/PersonaTypesView.vue'
import SignUpView from '@/views/SignUpView.vue'
import LoginView from '@/views/LoginView.vue'
import PasswordResetView from '@/views/PasswordResetView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/products', name: 'products', component: ProductsView, meta: { requiresAuth: true } },
    {
      path: '/products/:productType/:productId/subscribe',
      name: 'product-subscribe',
      component: ProductSubscriptionView,
      meta: { requiresAuth: true },
    },
    {
      path: '/products/:productType/:productId',
      name: 'product-detail',
      component: ProductDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/virtual',
      component: VirtualInvestView,
      meta: { requiresAuth: true },
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
        {
          path: 'holdings/:holdingProductId/termination',
          name: 'product-termination',
          component: ProductTerminationView,
        },
        {
          path: 'trade/:securityId',
          name: 'virtual-trade',
          component: () => import('@/views/TradeView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'securities/:pk',
          name: 'security-detail',
          component: SecurityDetailView,
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/virtual/start',
      name: 'virtual-start',
      component: VirtualInvestStartView,
      meta: { requiresAuth: true },
    },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView, meta: { requiresAuth: true } },
    { path: '/my', name: 'my', component: MyPageView, meta: { requiresAuth: true } },
    {
      path: '/my/profile',
      name: 'my-profile',
      component: MyProfileView,
      meta: { requiresAuth: true, hideBottomTabBar: true },
    },
    {
      path: '/my/friends',
      name: 'friend-management',
      component: FriendManagementView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { hideBottomTabBar: true, guestOnly: true },
    },
    {
      path: '/password-reset',
      name: 'password-reset',
      component: PasswordResetView,
      meta: { hideBottomTabBar: true, guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignUpView,
      meta: { hideBottomTabBar: true, guestOnly: true },
    },
    {
      path: '/game/allocation',
      name: 'game-allocation',
      component: GameAllocationView,
      meta: { requiresAuth: true, hideBottomTabBar: true },
    },
    {
      path: '/game/introduction',
      name: 'game-introduction',
      component: GameIntroductionView,
      meta: { requiresAuth: true, hideBottomTabBar: true },
    },
    {
      path: '/game/tutorial',
      name: 'game-tutorial',
      component: GameTutorialView,
      meta: { requiresAuth: true, hideBottomTabBar: true },
    },
    {
      path: '/game/start',
      name: 'game-start',
      component: GameStartView,
      meta: { requiresAuth: true, hideBottomTabBar: true },
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      meta: { requiresAuth: true, hideBottomTabBar: true },
      beforeEnter: () => {
        if (!readGameStartSession()) return { name: 'game-introduction' }
      },
    },
    {
      path: '/assessment/result',
      name: 'assessment-result',
      component: AssessmentResultView,
      meta: { requiresAuth: true },
    },
    {
      path: '/assessment/personas',
      name: 'persona-types',
      component: PersonaTypesView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
