<!-- views/BlogView.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePortfolio } from '@/composables/usePortfolio'
import { 
  Search, 
  X, 
  FileText, 
  SearchX, 
  Calendar, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-vue-next'

const { blogs, getBlogs } = usePortfolio()

// Selalu aktifkan loading pada setiap pemuatan halaman
const isPageLoading = ref(true)

const searchQuery = ref('')
const currentPage = ref<number>(1)
const itemsPerPage = 10

const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const filteredBlogs = computed(() => {
  if (!searchQuery.value.trim()) return blogs.value
  const query = searchQuery.value.toLowerCase()
  return blogs.value.filter(b => 
    b.title.toLowerCase().includes(query) ||
    stripHtml(b.content).toLowerCase().includes(query)
  )
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredBlogs.value.length / itemsPerPage))

const paginatedBlogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredBlogs.value.slice(start, end)
})

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(async () => {
  try {
    if (!blogs.value || blogs.value.length === 0) {
      await getBlogs(true)
    }
  } catch (error) {
    console.error('Gagal memuat data artikel:', error)
  } finally {
    // Berikan sedikit jeda agar transisi skeleton terasa mulus
    setTimeout(() => {
      isPageLoading.value = false
    }, 400)
  }
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
    
    <header class="mb-10 text-center max-w-xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Artikel & Catatan</h1>
      <p class="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
        Berisi catatan teknis, tutorial pemrograman, pembahasan seputar sistem IoT, serta pengalaman pengembangan software lainnya.
      </p>
    </header>

    <!-- SEARCH BAR -->
    <div v-if="!isPageLoading && blogs.length > 0" class="mb-8 max-w-md mx-auto">
      <div class="relative">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search class="w-5 h-5" />
        </span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari judul artikel atau isi catatan..." 
          class="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 dark:focus:ring-emerald-500 shadow-xs transition"
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''" 
          class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 1. SKELETON LOADING STATE -->
    <div v-if="isPageLoading" class="flex flex-col gap-6">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-pulse">
        <div class="w-full h-48 bg-slate-200 dark:bg-slate-800"></div>
        <div class="p-6 space-y-3">
          <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
          <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div class="space-y-2 pt-1">
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
          </div>
          <div class="pt-2">
            <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. KONTEN UTAMA BLOG -->
    <template v-else>
      <!-- STATE: DATA KOSONG KESELURUHAN -->
      <div v-if="blogs.length === 0" class="text-center py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3">
          <FileText class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">Belum Ada Artikel</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Artikel atau catatan belum dipublikasikan saat ini.</p>
      </div>

      <!-- STATE: HASIL PENCARIAN KOSONG -->
      <div v-else-if="filteredBlogs.length === 0" class="text-center py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3">
          <SearchX class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">Artikel Tidak Ditemukan</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm px-4">
          Tidak ada artikel yang cocok dengan kata kunci "<span class="font-semibold text-slate-700 dark:text-slate-300 break-all">{{ searchQuery }}</span>".
        </p>
        <button @click="searchQuery = ''" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer">
          Reset Pencarian
        </button>
      </div>

      <!-- STATE: DAFTAR BLOG -->
      <template v-else>
        <div class="flex flex-col gap-6 mb-10">
          <article v-for="blog in paginatedBlogs" :key="blog.id" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition">
            
            <div v-if="blog.cover_image" class="w-full h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
              <img 
                :src="blog.cover_image" 
                :alt="blog.title" 
                class="w-full h-full object-cover transition duration-300 hover:scale-105" 
                loading="lazy"
              />
            </div>

            <div class="p-6 flex flex-col flex-1">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium mb-2 flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5" />
                {{ new Date(blog.created_at || '').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
              </span>

              <h2 class="text-lg font-medium text-slate-900 dark:text-white mb-2">{{ blog.title }}</h2>
              
              <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                {{ stripHtml(blog.content) }}
              </p>

              <div class="pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <router-link 
                  v-if="blog.slug" 
                  :to="`/blog/${blog.slug}`" 
                  class="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 transition"
                >
                  Baca Selengkapnya <ArrowRight class="w-3.5 h-3.5" />
                </router-link>
              </div>
            </div>

          </article>
        </div>

        <!-- PAGINATION CONTROLS -->
        <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" /> Sebelumnya
          </button>

          <div class="flex items-center gap-1 px-2">
            <button 
              v-for="page in totalPages" 
              :key="page" 
              @click="changePage(page)"
              class="w-8 h-8 text-xs font-medium rounded-lg transition cursor-pointer"
              :class="currentPage === page ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'"
            >
              {{ page }}
            </button>
          </div>

          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Selanjutnya <ChevronRight class="w-4 h-4" />
          </button>
        </nav>
      </template>
    </template>

  </main>
</template>