<!-- App.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isMobileMenuOpen = ref(false)

// Otomatis menutup menu mobile saat rute halaman berubah
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
    
    <!-- NAVIGATION BAR -->
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <!-- BRAND LOGO -->
        <RouterLink to="/" class="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 group">
          <span class="text-emerald-600 group-hover:scale-105 transition-transform">&lt;/&gt;</span> 
          <span>Faizyee</span>
        </RouterLink>

        <!-- DESKTOP NAV LINKS -->
        <nav class="hidden sm:flex items-center gap-6 text-sm font-medium">
          <RouterLink 
            to="/" 
            class="text-slate-600 hover:text-emerald-700 transition"
            active-class="text-emerald-700 font-semibold"
          >
            Home
          </RouterLink>
          <RouterLink 
            to="/projects" 
            class="text-slate-600 hover:text-emerald-700 transition"
            active-class="text-emerald-700 font-semibold"
          >
            Proyek
          </RouterLink>
          <RouterLink 
            to="/blogs" 
            class="text-slate-600 hover:text-emerald-700 transition"
            active-class="text-emerald-700 font-semibold"
          >
            Blog
          </RouterLink>
          <RouterLink 
            to="/admin" 
            class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
            active-class="!bg-emerald-50 !text-emerald-800 border border-emerald-200"
          >
            Dashboard Admin
          </RouterLink>
        </nav>

        <!-- MOBILE MENU BUTTON (HAMBURGER) -->
        <button 
          @click="isMobileMenuOpen = !isMobileMenuOpen" 
          class="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition focus:outline-none"
          aria-label="Toggle Menu"
        >
          <!-- Ikon Garis Tiga (Menu) -->
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <!-- Ikon Silang (Close) -->
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- MOBILE MENU DROPDOWN -->
      <div v-if="isMobileMenuOpen" class="sm:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-sm">
        <RouterLink 
          to="/" 
          class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition"
        >
          Home
        </RouterLink>
        <RouterLink 
          to="/projects" 
          class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition"
        >
          Proyek
        </RouterLink>
        <RouterLink 
          to="/blogs" 
          class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition"
        >
          Blog
        </RouterLink>
        <RouterLink 
          to="/admin" 
          class="block px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          Dashboard Admin
        </RouterLink>
      </div>
    </header>

    <!-- MAIN CONTENT VIEW -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- FOOTER -->
    <footer class="bg-white border-t border-slate-200 mt-auto py-8 text-xs sm:text-sm text-slate-500">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <p>&copy; {{ new Date().getFullYear() }} Faizyee. All rights reserved.</p>
        <p class="text-slate-400">
          Built with 
          <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 underline transition">Vue 3</a>, 
          <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 underline transition">TypeScript</a> & 
          <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-600 underline transition">Supabase</a>
        </p>
      </div>
    </footer>

  </div>
</template>