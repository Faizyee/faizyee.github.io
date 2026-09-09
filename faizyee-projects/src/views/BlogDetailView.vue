<!-- views/BlogDetailView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head' // <-- Diimpor untuk manajemen Head/SEO dinamis
import { supabase } from '../lib/supabaseClient'
import type { Blog } from '../types/portfolio'
import { useAds } from '../composables/useAds'
import { 
  ArrowLeft, 
  Clock, 
  Type, 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Volume2 
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const blog = ref<Blog | null>(null)
const loading = ref<boolean>(true)
const notFound = ref<boolean>(false)

const { ads, fetchActiveAds } = useAds()

// === DINAMIS HTML HEAD (SEO & OPEN GRAPH) ===
useHead({
  title: computed(() => blog.value?.title ? `${blog.value.title} - Faizyee Blog` : 'Memuat Artikel...'),
  meta: [
    { 
      name: 'description', 
      content: computed(() => {
        if (!blog.value?.content) return 'Baca artikel terbaru seputar teknologi dan pemrograman di Faizyee.'
        const plain = blog.value.content.replace(/<[^>]*>?/gm, '')
        return plain.length > 150 ? plain.substring(0, 150) + '...' : plain
      }) 
    },
    // Open Graph / Media Sosial (WhatsApp, Facebook, LinkedIn)
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: computed(() => blog.value?.title || 'Faizyee Blog') },
    { 
      property: 'og:description', 
      content: computed(() => {
        if (!blog.value?.content) return 'Baca artikel terbaru seputar teknologi dan pemrograman di Faizyee.'
        const plain = blog.value.content.replace(/<[^>]*>?/gm, '')
        return plain.length > 150 ? plain.substring(0, 150) + '...' : plain
      }) 
    },
    { property: 'og:image', content: computed(() => blog.value?.cover_image || 'https://faizyee.github.io/og-image.jpg') },
    { property: 'og:url', content: computed(() => `https://faizyee.github.io/blog/${route.params.slug}`) },
    
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => blog.value?.title || 'Faizyee Blog') },
    { 
      name: 'twitter:description', 
      content: computed(() => {
        if (!blog.value?.content) return 'Baca artikel terbaru seputar teknologi dan pemrograman di Faizyee.'
        const plain = blog.value.content.replace(/<[^>]*>?/gm, '')
        return plain.length > 150 ? plain.substring(0, 150) + '...' : plain
      }) 
    },
    { name: 'twitter:image', content: computed(() => blog.value?.cover_image || 'https://faizyee.github.io/og-image.jpg') }
  ],
  link: [
    { rel: 'canonical', href: computed(() => `https://faizyee.github.io/blogs/${route.params.slug}`) }
  ]
})

// === STATE ALAT BANTU BACA: FONT SIZE (A++ / A--) ===
const fontSizePx = ref<number>(16) // Ukuran font awal (16px)

const increaseFont = () => {
  if (fontSizePx.value < 26) fontSizePx.value += 2
}

const decreaseFont = () => {
  if (fontSizePx.value > 12) fontSizePx.value -= 2
}

// === STATE ALAT BANTU BACA: TEXT-TO-SPEECH & WORD HIGHLIGHT ===
const audioState = ref<'idle' | 'playing' | 'paused'>('idle')
const activeCharIndex = ref<number>(0)
let currentUtterance: SpeechSynthesisUtterance | null = null

const playAudio = () => {
  if (!('speechSynthesis' in window)) {
    alert('Maaf, browser Anda tidak mendukung fitur pemutar suara.')
    return
  }

  // Jika sedang dijeda (paused), lanjutkan (resume)
  if (audioState.value === 'paused') {
    window.speechSynthesis.resume()
    audioState.value = 'playing'
    return
  }

  // Jika baru atau ingin memutar dari awal
  window.speechSynthesis.cancel()
  if (!blog.value) return

  const plainContent = blog.value.content.replace(/<[^>]*>?/gm, '')
  const fullText = `${blog.value.title}. ${plainContent}`

  currentUtterance = new SpeechSynthesisUtterance(fullText)
  currentUtterance.lang = 'id-ID'
  currentUtterance.rate = 1.0

  // Melacak indeks karakter secara real-time per kata
  currentUtterance.onboundary = (event) => {
    if (event.name === 'word' || event.name === 'sentence') {
      activeCharIndex.value = event.charIndex
    }
  }

  currentUtterance.onend = () => {
    audioState.value = 'idle'
    activeCharIndex.value = 0
  }
  currentUtterance.onerror = () => {
    audioState.value = 'idle'
    activeCharIndex.value = 0
  }

  window.speechSynthesis.speak(currentUtterance)
  audioState.value = 'playing'
}

const pauseAudio = () => {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause()
    audioState.value = 'paused'
  }
}

const restartAudio = () => {
  window.speechSynthesis.cancel()
  audioState.value = 'idle'
  activeCharIndex.value = 0
  playAudio()
}

const stopAudio = () => {
  window.speechSynthesis.cancel()
  audioState.value = 'idle'
  activeCharIndex.value = 0
}

// Menghentikan suara otomatis jika halaman ditutup/pindah
onUnmounted(() => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
})

// Menghitung estimasi waktu baca (asumsi 200 kata per menit)
const readingTime = computed(() => {
  if (!blog.value?.content) return '1 menit'
  const plainText = blog.value.content.replace(/<[^>]*>?/gm, '')
  const words = plainText.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${minutes} menit baca`
})

// === LOGIKA PEMILIHAN IKLAN SECARA ACAK (RANDOM) & BATASAN POSISI ===

// Header: Maksimal 1 iklan
const headerAd = computed(() => {
  const list = ads.value.filter(ad => ad.position === 'header')
  if (list.length === 0) return null
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
})

// Footer: Maksimal 1 iklan
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

// === HELPER: MEMBUNGKUS KATA DALAM HTML UNTUK SOROTAN PER KATA ===
const wrapHtmlWords = (html: string, baseOffset: number) => {
  if (typeof window === 'undefined') return { wrappedHtml: html, totalLength: baseOffset + html.replace(/<[^>]*>?/gm, '').length }
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const container = doc.body.firstElementChild!
  
  let currentOffset = baseOffset

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (!text) return

      let fragmentHtml = ''
      const regex = /([\p{L}\p{N}]+|[^\p{L}\p{N}\s]+|\s+)/gu
      let match

      while ((match = regex.exec(text)) !== null) {
        const token = match[0]
        const tokenStart = currentOffset + match.index
        const tokenEnd = tokenStart + token.length

        if (/^[\p{L}\p{N}]+$/u.test(token)) {
          fragmentHtml += `<span class="tts-word transition-colors duration-75" data-start="${tokenStart}" data-end="${tokenEnd}">${token}</span>`
        } else {
          fragmentHtml += token
        }
      }

      currentOffset += text.length
      
      const tempSpan = doc.createElement('span')
      tempSpan.innerHTML = fragmentHtml
      node.parentNode?.replaceChild(tempSpan, node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes)
      for (const child of children) {
        walk(child)
      }
    }
  }

  walk(container)
  return {
    wrappedHtml: container.innerHTML,
    totalLength: currentOffset
  }
}

// === STRUKTUR BLOK ARTIKEL DENGAN WRAPPER KATA (WORD-LEVEL HIGHLIGHT) ===
const processedArticleBlocks = computed(() => {
  if (!blog.value?.content) return { wrappedTitleHtml: '', blocks: [] }

  const title = blog.value.title || ''
  let currentOffset = 0

  const wrappedTitleObj = wrapHtmlWords(title, currentOffset)
  currentOffset = wrappedTitleObj.totalLength + 2 // +2 untuk spasi/titik antar judul & isi

  const rawParagraphs = blog.value.content.split('</p>')
  const adsList = inContentAds.value
  let adIndex = 0
  const blocks = []

  for (let i = 0; i < rawParagraphs.length; i++) {
    const paragraphHtml = rawParagraphs[i] + (i < rawParagraphs.length - 1 ? '</p>' : '')
    const paragraphPlain = rawParagraphs[i]?.replace(/<[^>]*>?/gm, '').trim()

    if (paragraphPlain) {
      const wrappedObj = wrapHtmlWords(paragraphHtml, currentOffset)
      blocks.push({
        type: 'paragraph',
        html: wrappedObj.wrappedHtml
      })
      currentOffset = wrappedObj.totalLength + 1 // +1 untuk spasi antar paragraf
    }

    // Sisipkan iklan in-content tiap 4 paragraf
    if (i % 4 === 2 && adIndex < adsList.length) {
      blocks.push({
        type: 'ad',
        adData: adsList[adIndex]
      })
      adIndex++
    }
  }

  return {
    wrappedTitleHtml: wrappedTitleObj.wrappedHtml,
    blocks
  }
})

// Watcher untuk memperbarui kelas aktif pada kata yang sedang dibacakan
watch(activeCharIndex, (newIndex) => {
  if (audioState.value === 'idle') {
    const words = document.querySelectorAll('.tts-word')
    words.forEach(el => el.classList.remove('bg-emerald-200', 'dark:bg-emerald-800', 'text-slate-900', 'dark:!text-white', 'rounded', 'px-0.5', 'font-semibold'))
    return
  }

  const words = document.querySelectorAll('.tts-word')
  words.forEach((el) => {
    const start = parseInt(el.getAttribute('data-start') || '0', 10)
    const end = parseInt(el.getAttribute('data-end') || '0', 10)
    
    if (newIndex >= start && newIndex < end) {
      el.classList.add('bg-emerald-200', 'dark:bg-emerald-800', 'text-slate-900', 'dark:!text-white', 'rounded', 'px-0.5', 'font-semibold')
    } else {
      el.classList.remove('bg-emerald-200', 'dark:bg-emerald-800', 'text-slate-900', 'dark:!text-white', 'rounded', 'px-0.5', 'font-semibold')
    }
  })
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
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-3xl mx-auto">
      <!-- Back Button -->
      <button 
        @click="router.back()" 
        class="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition mb-6 cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4 mr-1.5" /> Kembali
      </button>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20 text-slate-500 dark:text-slate-400">
        <p class="text-sm animate-pulse">Memuat artikel...</p>
      </div>

      <!-- Not Found State -->
      <div v-else-if="notFound" class="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
        <h2 class="text-xl font-semibold text-slate-900 dark:!text-white mb-2">Artikel Tidak Ditemukan</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Maaf, artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
        <router-link to="/blogs" class="inline-block bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition">
          Lihat Artikel Lain
        </router-link>
      </div>

      <!-- Article Content -->
      <article v-else-if="blog" class="bg-white dark:bg-slate-900 text-slate-900 dark:!text-white rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        
        <!-- Cover Image -->
        <div v-if="blog.cover_image" class="w-full h-64 sm:h-80 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img :src="blog.cover_image" :alt="blog.title" class="w-full h-full object-cover" />
        </div>

        <div class="p-6 sm:p-10">
          
          <!-- Article Header -->
          <header class="mb-6">
            <h1 
              class="text-2xl sm:text-3xl font-bold text-slate-900 dark:!text-white tracking-tight leading-tight mb-3"
              v-html="processedArticleBlocks.wrappedTitleHtml"
            ></h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Diterbitkan pada {{ new Date(blog.created_at || '').toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB
            </p>
          </header>

          <!-- === ALAT BANTU BACA (TOOLBAR) === -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs">
            
            <!-- Estimasi Waktu Baca -->
            <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <Clock class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{{ readingTime }}</span>
            </div>

            <!-- Tombol Pengatur Font A-- / A++ -->
            <div class="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-xs">
              <Type class="w-4 h-4 text-slate-500 dark:text-slate-400 mr-0.5" />
              <button 
                @click="decreaseFont" 
                class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded font-bold transition cursor-pointer"
                title="Perkecil Ukuran Teks"
              >
                A--
              </button>
              <span class="text-slate-600 dark:text-slate-300 font-mono px-1 text-xs">{{ fontSizePx }}px</span>
              <button 
                @click="increaseFont" 
                class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded font-bold transition cursor-pointer"
                title="Perbesar Ukuran Teks"
              >
                A++
              </button>
            </div>

            <!-- Tombol Kontrol Audio (Play, Pause/Resume, Restart, Stop) -->
            <div class="flex items-center gap-1.5">
              <template v-if="audioState === 'idle'">
                <button 
                  @click="playAudio" 
                  class="inline-flex items-center p-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-medium transition cursor-pointer"
                >
                  <Volume2 class="w-3.5 h-3.5" />
                </button>
              </template>

              <template v-else-if="audioState === 'playing'">
                <button 
                  @click="pauseAudio" 
                  class="inline-flex items-center p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition cursor-pointer"
                  title="Jeda pemutaran audio"
                >
                  <Pause class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="stopAudio" 
                  class="inline-flex items-center p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition cursor-pointer"
                  title="Berhentikan total"
                >
                  <Square class="w-3.5 h-3.5" />
                </button>
              </template>

              <template v-else-if="audioState === 'paused'">
                <button 
                  @click="playAudio" 
                  class="inline-flex items-center p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition cursor-pointer"
                  title="Lanjutkan pemutaran dari posisi terjeda (Resume)"
                >
                  <Play class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="restartAudio" 
                  class="inline-flex items-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer"
                  title="Ulangi pemutaran dari awal (Restart)"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="stopAudio" 
                  class="inline-flex items-center p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition cursor-pointer"
                  title="Berhentikan total"
                >
                  <Square class="w-3.5 h-3.5" />
                </button>
              </template>
            </div>

          </div>

          <!-- Iklan Posisi: HEADER -->
          <div v-if="headerAd" class="my-6 p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg relative overflow-hidden">
            <span class="absolute top-1 right-2 text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase">Iklan / Sponsor</span>
            <div v-if="headerAd.image_url" class="mt-2 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <a :href="headerAd.target_url || '#'" target="_blank" rel="noopener noreferrer">
                <img :src="headerAd.image_url" :alt="headerAd.title" class="max-w-full max-h-full object-contain" />
              </a>
            </div>
            <div class="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="space-y-1.5 pr-2">
                <h4 class="text-sm font-semibold text-slate-900 dark:!text-white">{{ headerAd.title }}</h4>
                <p v-if="headerAd.description" class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {{ headerAd.description }}
                </p>
              </div>
              <a :href="headerAd.target_url || '#'" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white !text-white no-underline text-xs font-medium px-4 py-2 rounded-lg transition text-center w-full sm:w-auto">
                {{ headerAd.button_text || 'Kunjungi' }}
              </a>
            </div>
          </div>

          <hr class="border-slate-100 dark:border-slate-800 mb-8" />

          <!-- Rich Text Body -->
          <div 
            :style="{ fontSize: fontSizePx + 'px' }" 
            class="article-body text-slate-700 dark:text-slate-300 leading-relaxed transition-all duration-150"
          >
            <template v-for="(block, index) in processedArticleBlocks.blocks" :key="index">
              <!-- Paragraf dengan sorotan per kata -->
              <div 
                v-if="block.type === 'paragraph'"
                class="mb-5"
                v-html="block.html"
              ></div>

              <!-- Iklan In-Content -->
              <div 
                v-else-if="block.type === 'ad'" 
                class="my-6 p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg relative overflow-hidden"
              >
                <span class="absolute top-1 right-2 text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase">Iklan / Sponsor</span>
                <a v-if="block.adData?.image_url" :href="block.adData?.target_url || '#'" target="_blank" rel="noopener noreferrer">
                  <div class="mt-2 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img :src="block.adData?.image_url" :alt="block.adData?.title" class="max-w-full max-h-full object-contain" />
                  </div>
                </a>
                <div class="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div class="space-y-1.5 pr-2">
                    <h4 class="text-sm font-semibold text-slate-900 dark:!text-white">{{ block.adData?.title }}</h4>
                    <p v-if="block.adData?.description" class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {{ block.adData?.description }}
                    </p>
                  </div>
                  <a :href="block.adData?.target_url || '#'" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white !text-white no-underline text-xs font-medium px-4 py-2 rounded-lg transition text-center w-full sm:w-auto">
                    {{ block.adData?.button_text || 'Kunjungi' }}
                  </a>
                </div>
              </div>
            </template>
          </div>

          <!-- Iklan Posisi: FOOTER -->
          <div v-if="footerAd" class="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div class="p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg relative overflow-hidden">
              <span class="absolute top-2 right-3 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">Iklan / Sponsor</span>
              <div v-if="footerAd.image_url" class="mt-2 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <a :href="footerAd.target_url || '#'" target="_blank" rel="noopener noreferrer">
                  <img :src="footerAd.image_url" :alt="footerAd.title" class="max-w-full max-h-full object-contain" />
                </a>
              </div>
              <div class="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="space-y-1.5 pr-2">
                  <h4 class="text-sm font-semibold text-slate-900 dark:!text-white">{{ footerAd.title }}</h4>
                  <p v-if="footerAd.description" class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {{ footerAd.description }}
                  </p>
                </div>
                <a :href="footerAd.target_url || '#'" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 !text-white no-underline text-xs font-medium px-4 py-2 rounded-lg transition text-center w-full sm:w-auto">
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
/* Styling TipTap Editor & Rich Text */
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
.article-body :deep(h1) { font-size: 1.75em; }
.article-body :deep(h2) { font-size: 1.5em; }
.article-body :deep(h3) { font-size: 1.25em; }
.article-body :deep(p) { margin-bottom: 1.25rem; }
.article-body :deep(ul) { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
.article-body :deep(ol) { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
.article-body :deep(li) { margin-bottom: 0.35rem; }
.article-body :deep(blockquote) { border-left: 4px solid #047857; padding-left: 1rem; font-style: italic; color: #475569; margin: 1.5rem 0; }
.article-body :deep(code) { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-size: 0.875em; font-family: monospace; color: #0f172a; }
.article-body :deep(pre) { background-color: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1.5rem 0; }
.article-body :deep(pre code) { background-color: transparent; color: inherit; padding: 0; }
.article-body :deep(img) { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem auto; }

/* Dark Mode Overrides untuk TipTap / Rich Text Body */
:global(.dark) .article-body :deep(h1),
:global(.dark) .article-body :deep(h2),
:global(.dark) .article-body :deep(h3),
:global(.dark) .article-body :deep(h4) {
  color: #f8fafc;
}
:global(.dark) .article-body :deep(blockquote) {
  border-left-color: #10b981;
  color: #94a3b8;
}
:global(.dark) .article-body :deep(code) {
  background-color: #1e293b;
  color: #f8fafc;
}
:global(.dark) .article-body :deep(pre) {
  background-color: #090d16;
  border: 1px solid #1e293b;
  color: #e2e8f0;
}

/* Menargetkan link khusus di dalam teks artikel saja agar tombol iklan aman */
.article-body :deep(p a),
.article-body :deep(li a),
.article-body :deep(blockquote a) { 
  color: #047857; 
  text-decoration: underline; 
}
:global(.dark) .article-body :deep(p a),
:global(.dark) .article-body :deep(li a),
:global(.dark) .article-body :deep(blockquote a) {
  color: #34d399;
}
</style>