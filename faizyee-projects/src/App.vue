<!-- App.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { usePortfolio } from '@/composables/usePortfolio' // <-- Diimpor untuk akses data profil global

const route = useRoute()
const isMobileMenuOpen = ref(false)
const isDark = ref(false)

const { profile, fetchAllData } = usePortfolio()

// Ambil data profil secara global saat aplikasi pertama kali dimuat
onMounted(async () => {
  try {
    await fetchAllData()
  } catch (error) {
    console.error('Gagal memuat data global:', error)
  }
})

// Cek tema yang tersimpan di localStorage atau preferensi sistem saat dimuat
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
})

// === KONFIGURASI GLOBAL HEAD (FAVICON DINAMIS, DOMAIN, & THEME COLOR) ===
useHead({
  title: computed(() => profile.value?.full_name && profile.value?.title ? `${profile.value?.full_name} - ${profile.value?.title}` : 'Faizyee - Portofolio & Blog Teknologi'),
  link: [
    { 
      rel: 'icon', 
      type: 'image/x-icon', 
      href: computed(() => profile.value?.avatar_url || 'https://faizyee.github.io/favicon.ico') 
    },
    { 
      rel: 'shortcut icon', 
      href: computed(() => profile.value?.avatar_url || 'https://faizyee.github.io/favicon.ico') 
    },
    { rel: 'canonical', href: 'https://faizyee.github.io' }
  ],
  meta: [
    { property: 'og:site_name', content: computed(() => profile.value?.full_name || 'Faizyee Portfolio & Blog') },
    { property: 'og:url', content: 'https://faizyee.github.io' },
    { 
      name: 'theme-color', 
      content: computed(() => isDark.value ? '#0f172a' : '#ffffff') 
    }
  ]
})

// Fungsi untuk mengganti tema
const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Otomatis menutup menu mobile saat rute halaman berubah
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-emerald-100 selection:text-emerald-800 dark:selection:bg-emerald-950 dark:selection:text-emerald-200 transition-colors duration-300">
    
    <header class="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <RouterLink to="/" class="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 group">
          <span class="text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">&lt;/&gt;</span> 
          <span>Faizyee</span>
        </RouterLink>

        <div class="hidden sm:flex items-center gap-6 text-sm font-medium">
          <nav class="flex items-center gap-6">
            <RouterLink 
              to="/" 
              class="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
              active-class="!text-emerald-700 dark:!text-emerald-400 font-semibold"
            >
              Home
            </RouterLink>
            <RouterLink 
              to="/projects" 
              class="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
              active-class="!text-emerald-700 dark:!text-emerald-400 font-semibold"
            >
              Proyek
            </RouterLink>
            <RouterLink 
              to="/blogs" 
              class="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
              active-class="!text-emerald-700 dark:!text-emerald-400 font-semibold"
            >
              Blog
            </RouterLink>
            <RouterLink 
              to="/admin" 
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
              active-class="!bg-emerald-50 !text-emerald-800 dark:!bg-emerald-950/50 dark:!text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            >
              Dashboard Admin
            </RouterLink>
          </nav>

          <button 
            @click="toggleTheme" 
            class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            :aria-label="isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'"
          >
            <svg v-if="isDark" class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>
        </div>

        <div class="flex items-center sm:hidden gap-1">
          <button 
            @click="toggleTheme" 
            class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            aria-label="Toggle Theme"
          >
            <svg v-if="isDark" class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>

          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen" 
            class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="isMobileMenuOpen" class="sm:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2 shadow-sm transition-colors">
        <RouterLink 
          to="/" 
          class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
        >
          Home
        </RouterLink>
        <RouterLink 
          to="/projects" 
          class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
        >
          Proyek
        </RouterLink>
        <RouterLink 
          to="/blogs" 
          class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
        >
          Blog
        </RouterLink>
        <RouterLink 
          to="/admin" 
          class="block px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          Dashboard Admin
        </RouterLink>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <p>&copy; {{ new Date().getFullYear() }} Faizyee. All rights reserved.</p>
        <p class="text-slate-400 dark:text-slate-500">
          Built with 
          <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 dark:hover:text-emerald-400 underline transition">Vue 3</a>, 
          <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 dark:hover:text-emerald-400 underline transition">TypeScript</a> & 
          <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 dark:hover:text-emerald-400 underline transition">Supabase</a> in Indonesia 🇮🇩
        </p>
      </div>
    </footer>

  </div>
</template>