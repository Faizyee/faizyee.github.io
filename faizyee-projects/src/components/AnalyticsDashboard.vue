<!-- components/AnalyticsDashboard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Project, Blog, Ad } from '../types/portfolio'
import { 
  FolderGit2, 
  MonitorPlay, 
  BookOpen, 
  Megaphone, 
  Layers 
} from 'lucide-vue-next'

const props = defineProps<{
  projects: Project[]
  blogs: Blog[]
  ads: Ad[]
}>()

// Analisis Proyek
const projectStats = computed(() => {
  const total = props.projects.length
  const withDemo = props.projects.filter(p => p.demo_url).length
  const withRepo = props.projects.filter(p => p.repo_url).length
  
  // Menghitung frekuensi penggunaan Tech Stack
  const techCountMap: Record<string, number> = {}
  props.projects.forEach(p => {
    if (p.tech_stack && Array.isArray(p.tech_stack)) {
      p.tech_stack.forEach(tech => {
        const cleanTech = tech.trim()
        if (cleanTech) {
          techCountMap[cleanTech] = (techCountMap[cleanTech] || 0) + 1
        }
      })
    }
  })

  const sortedTechStack = Object.entries(techCountMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  return {
    total,
    withDemo,
    withRepo,
    demoPercentage: total > 0 ? Math.round((withDemo / total) * 100) : 0,
    repoPercentage: total > 0 ? Math.round((withRepo / total) * 100) : 0,
    sortedTechStack
  }
})

// Analisis Blog / Artikel
const blogStats = computed(() => {
  const total = props.blogs.length
  const published = props.blogs.filter(b => b.is_published).length
  const draft = props.blogs.filter(b => !b.is_published).length
  const publishRate = total > 0 ? Math.round((published / total) * 100) : 0

  return {
    total,
    published,
    draft,
    publishRate
  }
})

// Analisis Iklan / Ads
const adStats = computed(() => {
  const total = props.ads.length
  const active = props.ads.filter(a => a.is_active).length
  const inactive = props.ads.filter(a => !a.is_active).length
  const activeRate = total > 0 ? Math.round((active / total) * 100) : 0

  // Distribusi posisi iklan
  const positionCountMap: Record<string, number> = {
    header: 0,
    footer: 0,
    'in-content': 0,
    sidebar: 0
  }

  props.ads.forEach(a => {
    const pos = a.position || 'other'
    positionCountMap[pos] = (positionCountMap[pos] || 0) + 1
  })

  return {
    total,
    active,
    inactive,
    activeRate,
    positionCountMap
  }
})

// Nilai maksimum untuk skala persentase tech stack
const maxTechCount = computed(() => {
  const topTech = projectStats.value.sortedTechStack[0]
  return topTech ? topTech.count : 1
})
</script>

<template>
  <div class="space-y-6 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
    <!-- Header Informasi -->
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Analisis & Statistik Konten</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ringkasan performa portofolio, publikasi blog, dan pengelolaan iklan Anda secara real-time.</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
          Total Item: {{ projectStats.total + blogStats.total + adStats.total }} Konten & Iklan
        </span>
      </div>
    </div>

    <!-- Quick Stats Grid (Ringkasan Utama - 4 Kolom) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Proyek -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Proyek</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ projectStats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FolderGit2 class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <span>Demo: <strong class="text-slate-700 dark:text-slate-200">{{ projectStats.withDemo }}</strong></span>
          <span>Repo: <strong class="text-slate-700 dark:text-slate-200">{{ projectStats.withRepo }}</strong></span>
        </div>
      </div>

      <!-- Rasio Demo Proyek -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rasio Demo Proyek</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ projectStats.demoPercentage }}%</p>
          </div>
          <div class="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MonitorPlay class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4">
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div class="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500" :style="{ width: `${projectStats.demoPercentage}%` }"></div>
          </div>
        </div>
      </div>

      <!-- Total Artikel Blog -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Artikel Blog</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ blogStats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <BookOpen class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <span>Published: <strong class="text-emerald-600 dark:text-emerald-400">{{ blogStats.published }}</strong></span>
          <span>Draft: <strong class="text-amber-600 dark:text-amber-400">{{ blogStats.draft }}</strong></span>
        </div>
      </div>

      <!-- Total Iklan / Ads -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Slot Iklan</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ adStats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Megaphone class="w-6 h-6" />
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <span>Aktif: <strong class="text-emerald-600 dark:text-emerald-400">{{ adStats.active }}</strong></span>
          <span>Nonaktif: <strong class="text-slate-600 dark:text-slate-300">{{ adStats.inactive }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Main Content Analytics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Tech Stack Distribution (Populer) -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-base font-semibold text-slate-900 dark:text-white">Distribusi Tech Stack</h4>
          <span class="text-xs text-slate-500 dark:text-slate-400">Berdasarkan penggunaan di proyek</span>
        </div>

        <div v-if="projectStats.sortedTechStack.length === 0" class="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
          Belum ada data tech stack yang ditambahkan pada proyek.
        </div>

        <div v-else class="space-y-3.5 max-h-[320px] overflow-y-auto pr-2">
          <div v-for="tech in projectStats.sortedTechStack" :key="tech.name" class="space-y-1">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-700 dark:text-slate-300">{{ tech.name }}</span>
              <span class="text-slate-500 dark:text-slate-400">{{ tech.count }} Proyek</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                :style="{ width: `${(tech.count / maxTechCount) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Kesehatan Konten & Iklan -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <h4 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Kesehatan & Distribusi Iklan</h4>
          <div class="space-y-4 text-sm">
            <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-600 dark:text-slate-400">Rasio Iklan Aktif</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ adStats.activeRate }}%</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-600 dark:text-slate-400">Slot Header / Footer</span>
              <span class="font-semibold text-slate-900 dark:text-white">
                {{ (adStats.positionCountMap['header'] || 0) + (adStats.positionCountMap['footer'] || 0) }} Iklan
              </span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-600 dark:text-slate-400">Slot In-Content</span>
              <span class="font-semibold text-slate-900 dark:text-white">{{ adStats.positionCountMap['in-content'] || 0 }} Iklan</span>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 text-center">
          Analisis diperbarui secara otomatis dari database portofolio.
        </div>
      </div>

    </div>

    <!-- Rincian Statistik Konten & Iklan Table -->
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Layers class="w-4 h-4 text-slate-400" />
        <h4 class="text-base font-semibold text-slate-900 dark:text-white">Matrik Analisis Portofolio, Blog & Iklan</h4>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th class="px-6 py-3 font-medium">Kategori / Komponen</th>
              <th class="px-6 py-3 font-medium">Jumlah Total</th>
              <th class="px-6 py-3 font-medium">Rincian Status</th>
              <th class="px-6 py-3 font-medium">Status Optimal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <tr>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">Proyek Portofolio</td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">{{ projectStats.total }} Proyek</td>
              <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                {{ projectStats.withDemo }} dengan Demo, {{ projectStats.withRepo }} dengan Repository
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/60">Aktif</span>
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">Artikel Blog</td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">{{ blogStats.total }} Artikel</td>
              <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                {{ blogStats.published }} Terpublikasi, {{ blogStats.draft }} Draft Tersimpan
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/60">Baik</span>
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">Pengelolaan Iklan (Ads)</td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">{{ adStats.total }} Iklan</td>
              <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                {{ adStats.active }} Aktif, {{ adStats.inactive }} Nonaktif
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/60">Monetisasi</span>
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">Teknologi Digunakan</td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">{{ projectStats.sortedTechStack.length }} Teknologi</td>
              <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                Terbanyak: {{ projectStats.sortedTechStack[0]?.name || '-' }}
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/60">Beragam</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>