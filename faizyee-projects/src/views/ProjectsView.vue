<!-- views/ProjectsView.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePortfolio } from '@/composables/usePortfolio'
import { 
  Search, 
  X, 
  FolderOpen, 
  SearchX, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-vue-next'

const { projects, getProjects } = usePortfolio()

// Selalu aktifkan loading pada setiap pemuatan halaman
const isPageLoading = ref(true)

const searchQuery = ref('')
const currentPage = ref<number>(1)
const itemsPerPage = 10

const filteredProjects = computed(() => {
  if (!searchQuery.value.trim()) return projects.value
  const query = searchQuery.value.toLowerCase()
  return projects.value.filter(p => 
    p.title.toLowerCase().includes(query) ||
    p.description?.toLowerCase().includes(query) ||
    p.tech_stack?.some((tech: string) => tech.toLowerCase().includes(query))
  )
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredProjects.value.length / itemsPerPage))

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredProjects.value.slice(start, end)
})

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(async () => {
  try {
    if (!projects.value || projects.value.length === 0) {
      await getProjects()
    }
  } catch (error) {
    console.error('Gagal memuat data project:', error)
  } finally {
    // Berikan sedikit jeda agar transisi skeleton terasa mulus
    setTimeout(() => {
      isPageLoading.value = false
    }, 400)
  }
})
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
    
    <header class="mb-10 text-center max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Portofolio Project</h1>
      <p class="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
        Kumpulan proyek yang telah saya kerjakan, mencakup aplikasi web, sistem IoT, dan eksperimen pemrograman lainnya.
      </p>
    </header>

    <!-- SEARCH BAR -->
    <div v-if="!isPageLoading && projects.length > 0" class="mb-8 max-w-md mx-auto">
      <div class="relative">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search class="w-5 h-5" />
        </span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari project, teknologi, atau deskripsi..." 
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
    <div v-if="isPageLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-pulse flex flex-col">
        <div class="w-full h-48 bg-slate-200 dark:bg-slate-800"></div>
        <div class="p-6 space-y-4 flex-1 flex flex-col">
          <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div class="space-y-2 flex-1">
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
          </div>
          <div class="flex gap-2">
            <div class="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div class="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div class="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div class="flex-1 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div class="flex-1 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. KONTEN UTAMA PROJECT -->
    <template v-else>
      <!-- STATE: DATA KOSONG KESELURUHAN -->
      <div v-if="projects.length === 0" class="text-center py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3">
          <FolderOpen class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">Belum Ada Project</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Data proyek belum ditambahkan atau gagal dimuat.</p>
      </div>

      <!-- STATE: HASIL PENCARIAN KOSONG -->
      <div v-else-if="filteredProjects.length === 0" class="text-center py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3">
          <SearchX class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">Tidak Ditemukan</h3>
        <p class="text-slate-500 dark:text-slate-400 text-sm px-4">
          Tidak ada project yang cocok dengan kata kunci "<span class="font-semibold text-slate-700 dark:text-slate-300 break-all">{{ searchQuery }}</span>".
        </p>
        <button @click="searchQuery = ''" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer">
          Reset Pencarian
        </button>
      </div>

      <!-- STATE: DAFTAR PROJECT -->
      <template v-else>
        <div class="flex flex-wrap justify-center gap-6 mb-10">
          <article 
            v-for="project in paginatedProjects" 
            :key="project.id" 
            class="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            
            <div class="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
              <img 
                :src="project.cover_image || `https://api.dicebear.com/10.x/constellation/svg?seed=${project.id}`" 
                :alt="project.title" 
                class="w-full h-full object-cover transition duration-300 hover:scale-105" 
                loading="lazy"
              />
            </div>

            <div class="p-6 flex flex-col flex-1">
              <h2 class="text-lg font-medium text-slate-900 dark:text-white mb-2">{{ project.title }}</h2>
              <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1">{{ project.description }}</p>

              <div v-if="project.tech_stack?.length" class="flex flex-wrap gap-1.5 mb-6">
                <span v-for="(tech, idx) in project.tech_stack" :key="idx" class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs rounded font-medium">
                  {{ tech }}
                </span>
              </div>

              <div class="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <a 
                  v-if="project.demo_url" 
                  :href="project.demo_url" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="flex-1 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-medium py-2 px-3 rounded-lg text-center transition"
                >
                  Live Demo
                </a>
                <a 
                  v-if="project.repo_url" 
                  :href="project.repo_url" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium py-2 px-3 rounded-lg text-center transition"
                >
                  Repository
                </a>
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
              :class="currentPage === page ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
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