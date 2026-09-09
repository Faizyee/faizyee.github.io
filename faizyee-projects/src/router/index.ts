import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsView.vue')
    },
    {
      path: '/blogs',
      name: 'blogs',
      component: () => import('../views/BlogsView.vue')
    },
    {
      path: '/blog/:slug',
      name: 'blog-detail',
      component: () => import('../views/BlogDetailView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboard.vue'),
      meta: { requiresAuth: true }
    }
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Navigation Guard terintegrasi dengan pengecekan AAL
router.beforeEach(async (to, _from, next) => {
  const { data: sessionData } = await supabase.auth.getSession()
  const isAuthenticated = !!sessionData.session

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      return next({ name: 'login' })
    }

    // Cek apakah akun ini memerlukan verifikasi 2FA (AAL2)
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalData) {
      const isMfaPending = aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2'
      if (isMfaPending) {
        // Belum verifikasi 2FA, arahkan ke login untuk menampilkan form kode TOTP
        return next({ name: 'login' })
      }
    }
  } else if (to.name === 'login' && isAuthenticated) {
    // Jika sudah login, cek apakah 2FA sudah selesai
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const isMfaPending = aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2'

    if (!isMfaPending) {
      return next({ name: 'admin' })
    }
    // Jika isMfaPending true, biarkan di halaman login agar form 2FA tampil
  }

  next()
})

export default router