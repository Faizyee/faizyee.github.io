<!-- views/BlogDetailView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import type { Blog } from '../types/portfolio'
import { useAds } from '../composables/useAds'

const route = useRoute()
const router = useRouter()

const blog = ref<Blog | null>(null)
const loading = ref<boolean>(true)
const notFound = ref<boolean>(false)

const { ads, fetchActiveAds } = useAds()

// === LOGIKA PEMILIHAN IKLAN SECARA ACAK (RANDOM) & BATASAN POSISI ===

// Header: Maksimal 1 iklan (dipilih secara acak jika ada banyak)
const headerAd = computed(() => {
  const list = ads.value.filter(ad => ad.position === 'header')
  if (list.length === 0) return null
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
})

// Footer: Maksimal 1 iklan (dipilih secara acak jika ada banyak)
const footerAd = computed(() => {
  const list = ads.value.filter(ad => ad.position === 'footer')
  if (list.length === 0) return null
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
})

// In-Content: Diacak urutannya
const inContentAds = computed(() => {
  const list = ads.value.filter(ad => ad.position === 'in-content')
  return [...list].sort(() => Math.random() - 0.5)
})

// Helper untuk merender HTML markup iklan in-content (Menggunakan ad.button_text)
const createAdHtml = (ad: any) => {
  return `
    <div class="my-6 p-5 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden">
      <span class="absolute top-1 right-2 text-[9px] font-medium text-slate-400 uppercase">Iklan / Sponsor</span>
      <div v-if="${ad.image_url}" class="mt-2 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
        <a href="${ad.target_url} || '#'" target="_blank" rel="noopener noreferrer">
          <img src="${ad.image_url}" alt="${ad.title}" class="max-w-full max-h-full object-contain" />
        </a>
      </div>
      <div class="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-1.5 pr-2">
          <h4 class="text-sm font-semibold text-slate-900">${ad.title}</h4>
          <p v-if="${ad.description}" class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            ${ad.description}
          </p>
        </div>
        <a href="${ad.target_url} || '#'" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white !text-white no-underline text-xs font-medium px-4 py-2 rounded-lg transition text-center w-full sm:w-auto">
          ${ad.button_text || 'Kunjungi'}
        </a>
      </div>
    </div>
  `
}

// Menggabungkan konten artikel asli dengan iklan in-content (mengisi ~50% space jeda paragraf)
const renderedArticleContent = computed(() => {
  if (!blog.value?.content) return ''

  const content = blog.value.content
  const parts = content.split('</p>')
  if (parts.length <= 1) return content

  const adsList = inContentAds.value
  if (adsList.length === 0) return content

  let adIndex = 0
  let result = ''

  for (let i = 0; i < parts.length; i++) {
    result += parts[i]
    if (i < parts.length - 1) {
      result += '</p>'
      
      // Menyisipkan iklan setiap 4 paragraf
      if (i % 4 === 2 && adIndex < adsList.length) {
        result += createAdHtml(adsList[adIndex])
        adIndex++
      }
    }
  }

  return result
})

const fetchBlogDetail = async (): Promise<void> => {
  loading.value = true
  notFound.value = false
  const slugParam = route.params.slug as string

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slugParam)
    .single()

  if (error || !data) {
    notFound.value = true
  } else {
    blog.value = data as Blog
  }
  loading.value = false
}

watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    fetchBlogDetail()
  }
})

onMounted(async () => {
  await fetchBlogDetail()
  await fetchActiveAds()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Back Button -->
      <button 
        @click="router.back()" 
        class="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition mb-6 cursor-pointer"
      >
        &larr; Kembali
      </button>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20 text-slate-500">
        <p class="text-sm animate-pulse">Memuat artikel...</p>
      </div>

      <!-- Not Found State -->
      <div v-else-if="notFound" class="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <h2 class="text-xl font-semibold text-slate-900 mb-2">Artikel Tidak Ditemukan</h2>
        <p class="text-slate-500 text-sm mb-6">Maaf, artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
        <router-link to="/blogs" class="inline-block bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition">
          Lihat Artikel Lain
        </router-link>
      </div>

      <!-- Article Content -->
      <article v-else-if="blog" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        <!-- Cover Image -->
        <div v-if="blog.cover_image" class="w-full h-64 sm:h-80 overflow-hidden bg-slate-100">
          <img :src="blog.cover_image" :alt="blog.title" class="w-full h-full object-cover" />
        </div>

        <div class="p-6 sm:p-10">
          <!-- Article Header -->
          <header class="mb-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
              {{ blog.title }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-500">
              Diterbitkan pada {{ new Date(blog.created_at || '').toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB
            </p>
          </header>

          <!-- Iklan Posisi: HEADER -->
          <div v-if="headerAd" class="my-6 p-5 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden">
            <span class="absolute top-1 right-2 text-[9px] font-medium text-slate-400 uppercase">Iklan / Sponsor</span>
            <div v-if="headerAd.image_url" class="mt-2 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              <a :href="headerAd.target_url || '#'" target="_blank" rel="noopener noreferrer">
                <img :src="headerAd.image_url" :alt="headerAd.title" class="max-w-full max-h-full object-contain" />
              </a>
            </div>
            <div class="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="space-y-1.5 pr-2">
                <h4 class="text-sm font-semibold text-slate-900">{{ headerAd.title }}</h4>
                <p v-if="headerAd.description" class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {{ headerAd.description }}
                </p>
              </div>
              <a :href="headerAd.target_url || '#'" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white !text-white no-underline text-xs font-medium px-4 py-2 rounded-lg transition text-center w-full sm:w-auto">
                {{ headerAd.button_text || 'Kunjungi' }}
              </a>
            </div>
          </div>

          <hr class="border-slate-100 mb-8" />

          <!-- Rich Text Body dengan In-Content Ads -->
          <div class="article-body text-slate-700 text-base leading-relaxed" v-html="renderedArticleContent"></div>

          <!-- Iklan Posisi: FOOTER -->
          <div v-if="footerAd" class="mt-12 pt-6 border-t border-slate-100">
            <div class="p-6 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden">
              <span class="absolute top-2 right-3 text-[10px] font-medium text-slate-400 uppercase">Iklan / Sponsor</span>
              <div v-if="footerAd.image_url" class="mt-2 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                <a :href="footerAd.target_url || '#'" target="_blank" rel="noopener noreferrer">
                  <img :src="footerAd.image_url" :alt="footerAd.title" class="max-w-full max-h-full object-contain" />
                </a>
              </div>
              <div class="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="space-y-1.5 pr-2">
                  <h4 class="text-sm font-semibold text-slate-900">{{ footerAd.title }}</h4>
                  <p v-if="footerAd.description" class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {{ footerAd.description }}
                  </p>
                </div>
                <a :href="footerAd.target_url || '#'" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white !text-white no-underline text-xs font-medium px-4 py-2 rounded-lg transition text-center w-full sm:w-auto">
                  {{ footerAd.button_text || 'Kunjungi' }}
                </a>
              </div>
            </div>
          </div>

        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* Styling TipTap Editor */
.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  color: #0f172a;
  font-weight: 700;
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}
.article-body :deep(h1) { font-size: 1.75rem; }
.article-body :deep(h2) { font-size: 1.5rem; }
.article-body :deep(h3) { font-size: 1.25rem; }
.article-body :deep(p) { margin-bottom: 1.25rem; }
.article-body :deep(ul) { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
.article-body :deep(ol) { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
.article-body :deep(li) { margin-bottom: 0.35rem; }
.article-body :deep(blockquote) { border-left: 4px solid #047857; padding-left: 1rem; font-style: italic; color: #475569; margin: 1.5rem 0; }
.article-body :deep(code) { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-size: 0.875rem; font-family: monospace; color: #0f172a; }
.article-body :deep(pre) { background-color: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1.5rem 0; }
.article-body :deep(pre code) { background-color: transparent; color: inherit; padding: 0; }
.article-body :deep(img) { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem auto; }

/* Menargetkan link khusus di dalam teks artikel saja agar tombol iklan aman */
.article-body :deep(p a),
.article-body :deep(li a),
.article-body :deep(blockquote a) { 
  color: #047857; 
  text-decoration: underline; 
}
</style>