<!-- views/HomeView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortfolio } from '@/composables/usePortfolio'
import { 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  Calendar, 
  ExternalLink, 
  FolderGit2, 
  ArrowRight 
} from 'lucide-vue-next'

const { profile, contact, projects, blogs, fetchAllData } = usePortfolio()

// Batasi 4 project terakhir dan 6 blog terakhir
const recentProjects = computed(() => projects.value.slice(0, 4))
const recentBlogs = computed(() => blogs.value.slice(0, 6))

// Selalu aktifkan loading pada setiap pemuatan/fetch data baru
const isPageLoading = ref(true)

onMounted(async () => {
  try {
    await fetchAllData()
  } catch (error) {
    console.error('Gagal memuat data portofolio:', error)
  } finally {
    // Matikan loading setelah data selesai ditarik (bisa ditambah sedikit delay agar animasi halus)
    setTimeout(() => {
      isPageLoading.value = false
    }, 400)
  }
})

// Fungsi helper untuk membersihkan tag HTML dari konten blog untuk preview teks ringkas
const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
    
    <!-- 1. HERO / PROFILE SECTION -->
    <section>
      <!-- SKELETON HERO -->
      <div v-if="isPageLoading" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 mb-12 shadow-xs animate-pulse">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
          <div class="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div class="flex-1 space-y-3 w-full">
            <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 mx-auto sm:mx-0"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 mx-auto sm:mx-0"></div>
            <div class="space-y-2 pt-1">
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6"></div>
            </div>
            <div class="flex flex-wrap justify-center sm:justify-start gap-2 pt-3">
              <div class="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div class="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div class="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ACTUAL HERO -->
      <div v-else class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 mb-12 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 transition-colors">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
          <div v-if="profile?.avatar_url" class="shrink-0">
            <img :src="profile.avatar_url" :alt="profile.full_name" class="w-32 h-32 rounded-full object-cover border-2 border-emerald-600 dark:border-emerald-500 shadow-sm" />
          </div>
          <div class="flex-1 space-y-3">
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {{ profile?.full_name || 'Nama Belum Diatur' }}
            </h1>
            
            <h2 v-if="profile?.title" class="text-base font-semibold text-emerald-700 dark:text-emerald-400">
              {{ profile.title }}
            </h2>
            
            <p class="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {{ profile?.bio || 'Bio belum diisi.' }}
            </p>

            <!-- KONTAK RINGKAS -->
            <div class="flex flex-wrap justify-center sm:justify-start gap-2 pt-2" v-if="contact">
              <a v-if="contact.email" :href="`mailto:${contact.email}`" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer">
                <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ contact.email }}</span>
              </a>
              <a v-if="contact.phone" :href="`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`" target="_blank" rel="noopener" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer">
                <Phone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ contact.phone }}</span>
              </a>
              <a v-if="contact.github_url" :href="contact.github_url" target="_blank" rel="noopener" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer">
                <Github class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>GitHub</span>
              </a>
              <a v-if="contact.linkedin_url" :href="contact.linkedin_url" target="_blank" rel="noopener" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer">
                <Linkedin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. PROJECTS SECTION -->
    <section class="mb-14">
      <div class="flex items-center justify-between mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Project Terbaru</h2>
        <router-link to="/projects" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition flex items-center gap-1">
          Lihat Semua <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
      
      <!-- SKELETON PROJECTS -->
      <div v-if="isPageLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 4" :key="i" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-pulse flex flex-col">
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

      <!-- ACTUAL PROJECTS -->
      <template v-else>
        <div v-if="recentProjects.length === 0" class="text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-sm">
          Belum ada project yang ditambahkan.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article v-for="project in recentProjects" :key="project.id" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div class="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
              <img 
                :src="project.cover_image || `https://api.dicebear.com/10.x/constellation/svg?seed=${project.id}`" 
                :alt="project.title" 
                class="w-full h-full object-cover transition duration-300 hover:scale-105" 
                loading="lazy"
              />
            </div>
            <div class="p-6 flex flex-col flex-1">
              <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">{{ project.title }}</h3>
              <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1">{{ project.description }}</p>
              
              <div v-if="project.tech_stack?.length" class="flex flex-wrap gap-1.5 mb-6">
                <span v-for="(tech, idx) in project.tech_stack" :key="idx" class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs rounded font-medium">
                  {{ tech }}
                </span>
              </div>

              <div class="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <a v-if="project.demo_url" :href="project.demo_url" target="_blank" rel="noopener" class="flex-1 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-medium py-2 px-3 rounded-lg text-center transition inline-flex items-center justify-center gap-1.5 cursor-pointer">
                  <ExternalLink class="w-3.5 h-3.5" /> Live Demo
                </a>
                <a v-if="project.repo_url" :href="project.repo_url" target="_blank" rel="noopener" class="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium py-2 px-3 rounded-lg text-center transition inline-flex items-center justify-center gap-1.5 cursor-pointer">
                  <FolderGit2 class="w-3.5 h-3.5" /> Repository
                </a>
              </div>
            </div>
          </article>
        </div>
      </template>
    </section>

    <!-- 3. BLOGS SECTION -->
    <section class="mb-10">
      <div class="flex items-center justify-between mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Artikel & Catatan</h2>
        <router-link to="/blogs" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition flex items-center gap-1">
          Lihat Semua <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>

      <!-- SKELETON BLOGS -->
      <div v-if="isPageLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 6" :key="i" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs animate-pulse flex flex-col">
          <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-3"></div>
          <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-3"></div>
          <div class="space-y-2 mb-6 flex-1">
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
            <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
          </div>
        </div>
      </div>

      <!-- ACTUAL BLOGS -->
      <template v-else>
        <div v-if="recentBlogs.length === 0" class="text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-sm">
          Belum ada artikel yang ditulis.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article v-for="blog in recentBlogs" :key="blog.id" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition">
            <span class="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5" />
              {{ new Date(blog.created_at || '').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
            </span>
            <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">{{ blog.title }}</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
              {{ stripHtml(blog.content) }}
            </p>
            
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
              <router-link v-if="blog.slug" :to="`/blog/${blog.slug}`" class="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 transition">
                Baca Selengkapnya <ArrowRight class="w-3.5 h-3.5" />
              </router-link>
            </div>
          </article>
        </div>
      </template>
    </section>

  </main>
</template>