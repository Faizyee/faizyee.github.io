<!-- views/AdminDashboard.vue -->
<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { usePortfolio } from '../composables/usePortfolio'
import type { Profile, Contact, Project, Blog } from '../types/portfolio'
import TipTapEditor from '../components/TipTapEditor.vue'
import AnalyticsDashboard from '../components/AnalyticsDashboard.vue'
import { 
  LayoutDashboard, User, FolderKanban, FileText, Megaphone, Shield, 
  LogOut, Sun, Moon, Plus, Trash2, Edit, Check, X, AlertCircle, 
  Lock, KeyRound, QrCode, Smartphone, ExternalLink, Github, Linkedin, RefreshCw, Eye, EyeOff
} from 'lucide-vue-next'

// --- DARK MODE STATE ---
const isDarkMode = ref<boolean>(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// State untuk menampung ID proyek yang dipilih
const selectedProjects = ref<any[]>([])

// Cek apakah semua item sedang terpilih
const isAllSelected = computed(() => {
  return projectsList.value.length > 0 && selectedProjects.value.length === projectsList.value.length
})

// Cek apakah sebagian item terpilih (untuk indikator setengah centang/indeterminate)
const isIndeterminate = computed(() => {
  return selectedProjects.value.length > 0 && selectedProjects.value.length < projectsList.value.length
})

// Fungsi untuk memilih/membatalkan pilihan semua baris
const toggleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedProjects.value = projectsList.value.map(item => item.id)
  } else {
    selectedProjects.value = []
  }
}

// Contoh fungsi hapus massal (Bulk Delete)
const handleBulkDeleteProjects = async () => {
  if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedProjects.value.length} proyek terpilih?`)) return

  const { error } = await supabase.from('projects').delete().in('id', selectedProjects.value)
  if (!error) {
    selectedProjects.value = []
    try {
      projectsList.value = await getProjects()
      showStatus('Proyek terpilih berhasil dihapus.')
    } catch (err: any) {
      showStatus('Gagal memuat ulang daftar proyek: ' + err.message, 'error')
    }
  }
}

// State untuk menampung ID artikel blog yang dicentang
const selectedBlogs = ref<any[]>([])

const isAllBlogsSelected = computed(() => {
  return blogsList.value.length > 0 && selectedBlogs.value.length === blogsList.value.length
})

const isBlogsIndeterminate = computed(() => {
  return selectedBlogs.value.length > 0 && selectedBlogs.value.length < blogsList.value.length
})

const toggleSelectAllBlogs = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedBlogs.value = blogsList.value.map(blog => blog.id)
  } else {
    selectedBlogs.value = []
  }
}

const handleBulkDeleteBlogs = async () => {
  if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedBlogs.value.length} artikel terpilih?`)) return

  const { error } = await supabase.from('blogs').delete().in('id', selectedBlogs.value)
  if (!error) {
    selectedBlogs.value = []
    try {
      blogsList.value = await getBlogs()
      showStatus('Artikel blog terpilih berhasil dihapus.')
    } catch (err: any) {
      showStatus('Gagal memuat ulang daftar artikel: ' + err.message, 'error')
    }
  }
}

// State untuk menampung ID iklan yang dicentang
const selectedAds = ref<any[]>([])

const isAllAdsSelected = computed(() => {
  return adsList.value.length > 0 && selectedAds.value.length === adsList.value.length
})

const isAdsIndeterminate = computed(() => {
  return selectedAds.value.length > 0 && selectedAds.value.length < adsList.value.length
})

const toggleSelectAllAds = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedAds.value = adsList.value.map(ad => ad.id)
  } else {
    selectedAds.value = []
  }
}

const handleBulkDeleteAds = async () => {
  if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedAds.value.length} iklan terpilih?`)) return

  const { error } = await supabase.from('ads').delete().in('id', selectedAds.value)
  if (!error) {
    selectedAds.value = []
    try {
      await fetchAds()
      showStatus('Iklan terpilih berhasil dihapus.')
    } catch (err: any) {
      showStatus('Gagal memuat ulang daftar iklan: ' + err.message, 'error')
    }
  }
}

interface Ad {
  id?: number
  title: string
  image_url?: string
  target_url?: string
  position: string
  is_active: boolean
  created_at?: string
  description?: string
  button_text?: string
}

const {
  getProfile, saveProfile,
  getContact, saveContact,
  getProjects, addProject, updateProject, deleteProject,
  getBlogs, addBlog, updateBlog, deleteBlog,
  loading, clearData
} = usePortfolio()

// --- AUTHENTICATION & MFA ---
const isAuthenticated = ref<boolean>(true)
const isMfaRequired = ref<boolean>(false)

// --- SECURITY & 2FA STATES ---
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const mfaEnabled = ref<boolean>(false)
const enrolledFactorId = ref<string | null>(null)
const mfaEnrollmentData = ref<{ factorId: string; qrCode: string; secret: string } | null>(null)
const enrollCode = ref<string>('')

// --- TAB NAVIGATION ---
const activeTab = ref<'analytics' | 'profile' | 'projects' | 'blogs' | 'ads' | 'security'>('analytics')

// --- FORM DATA & EDIT STATES ---
const profileForm = reactive<Profile>({
  full_name: '',
  title: '',
  bio: '',
  avatar_url: ''
})

const contactForm = reactive<Contact>({
  email: '',
  phone: '',
  github_url: '',
  linkedin_url: ''
})

// Proyek State & Edit Mode
const editingProjectId = ref<number | null>(null)
const projectForm = reactive({
  title: '',
  description: '',
  tech_stack_raw: '',
  demo_url: '',
  repo_url: '',
  cover_image: ''
})

// Blog State & Edit Mode
const editingBlogId = ref<number | null>(null)
const blogForm = reactive({
  title: '',
  slug: '',
  content: '',
  cover_image: '',
  is_published: false
})
const isSlugManuallyModified = ref<boolean>(false)

// Ads State & Edit Mode
const adsList = ref<Ad[]>([])
const editingAdId = ref<number | null>(null)
const adForm = reactive<Ad>({
  title: '',
  image_url: '',
  target_url: '',
  position: '',
  is_active: true,
  description: '',
  button_text: ''
})

// --- LIST DATA ---
const projectsList = ref<Project[]>([])
const blogsList = ref<Blog[]>([])
const statusMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

// --- METHODS ---
const handleLogout = async () => {
  await supabase.auth.signOut()
  isAuthenticated.value = false
  isMfaRequired.value = false
  mfaEnrollmentData.value = null
  clearData()
  ;['has_loaded_portfolio', 'has_loaded_projects', 'has_loaded_blogs'].forEach(key => {
    sessionStorage.removeItem(key)
  })
  window.location.href = '/login'
}

// --- SECURITY: PASSWORD & 2FA ---
const handleUpdatePassword = async () => {
  if (!passwordForm.oldPassword) return showStatus('Password lama wajib diisi.', 'error')
  if (!passwordForm.newPassword) return showStatus('Password baru wajib diisi.', 'error')
  if (passwordForm.newPassword.length < 6) return showStatus('Password minimal 6 karakter.', 'error')
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return showStatus('Konfirmasi password tidak cocok.', 'error')
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error('Sesi pengguna tidak ditemukan.')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.oldPassword
    })
    if (signInError) throw new Error('Password lama salah.')

    const { error: updateError } = await supabase.auth.updateUser({ 
      password: passwordForm.newPassword 
    })
    if (updateError) throw updateError

    showStatus('Password akun berhasil diperbarui.')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    showStatus('Gagal memperbarui password: ' + err.message, 'error')
  }
}

const checkMfaStatus = async () => {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) throw error
    const verifiedFactor = data.totp.find(f => f.status === 'verified')
    if (verifiedFactor) {
      mfaEnabled.value = true
      enrolledFactorId.value = verifiedFactor.id
    } else {
      mfaEnabled.value = false
      enrolledFactorId.value = null
    }
  } catch (err: any) {
    console.error('Gagal memeriksa status MFA:', err.message)
  }
}

const startMfaEnrollment = async () => {
  try {
    const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors()
    if (!listError && factorsData) {
      for (const factor of factorsData.totp) {
        if ((factor as any).status === 'unverified' || factor.friendly_name?.includes('Faizyee Admin 2FA')) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Faizyee Admin 2FA - ${Date.now()}`
    })
    if (error) throw error

    mfaEnrollmentData.value = {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret
    }
  } catch (err: any) {
    showStatus('Gagal memulai pendaftaran 2FA: ' + err.message, 'error')
  }
}

const verifyMfaEnrollment = async () => {
  if (!mfaEnrollmentData.value || !enrollCode.value) return
  try {
    const factorId = mfaEnrollmentData.value.factorId
    const challenge = await supabase.auth.mfa.challenge({ factorId })
    if (challenge.error) throw challenge.error

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: enrollCode.value
    })
    if (error) throw error

    showStatus('Autentikasi 2 Faktor (2FA) berhasil diaktifkan!')
    mfaEnrollmentData.value = null
    enrollCode.value = ''
    await checkMfaStatus()
  } catch (err: any) {
    showStatus('Kode verifikasi salah atau kedaluwarsa: ' + err.message, 'error')
  }
}

const disableMfa = async () => {
  if (!enrolledFactorId.value || !confirm('Yakin ingin menonaktifkan Autentikasi 2 Faktor? Akun Anda akan kurang aman.')) return
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId.value })
    if (error) throw error

    showStatus('Autentikasi 2 Faktor berhasil dinonaktifkan.')
    enrolledFactorId.value = null
    mfaEnabled.value = false
    await checkMfaStatus()
  } catch (err: any) {
    showStatus('Gagal menonaktifkan 2FA: ' + err.message, 'error')
  }
}

const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
  statusMessage.value = { text, type }
  setTimeout(() => { statusMessage.value = null }, 3500)
}

const loadAllData = async () => {
  try {
    const prof = await getProfile()
    if (prof) Object.assign(profileForm, prof)

    const cont = await getContact()
    if (cont) Object.assign(contactForm, cont)

    projectsList.value = await getProjects()
    blogsList.value = await getBlogs()
    await fetchAds()
  } catch (err: any) {
    showStatus('Gagal memuat data: ' + err.message, 'error')
  }
}

// --- PROFILE ---
const handleSaveProfileAndContact = async () => {
  try {
    await saveProfile(profileForm)
    await saveContact(contactForm)
    showStatus('Profil & kontak berhasil diperbarui.')
  } catch (err: any) {
    showStatus('Gagal menyimpan profil: ' + err.message, 'error')
  }
}

// --- PROJECTS CRUD ---
const handleSaveProject = async () => {
  if (!projectForm.title) return showStatus('Judul proyek harus diisi.', 'error')

  try {
    const techArray = projectForm.tech_stack_raw
      ? projectForm.tech_stack_raw.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const payload = {
      title: projectForm.title,
      description: projectForm.description,
      tech_stack: techArray,
      demo_url: projectForm.demo_url || undefined,
      repo_url: projectForm.repo_url || undefined,
      cover_image: projectForm.cover_image || undefined
    }

    if (editingProjectId.value) {
      await updateProject(editingProjectId.value, payload)
      showStatus('Proyek berhasil diperbarui.')
    } else {
      await addProject(payload)
      showStatus('Proyek berhasil ditambahkan.')
    }

    resetProjectForm()
    projectsList.value = await getProjects()
  } catch (err: any) {
    showStatus('Gagal menyimpan proyek: ' + err.message, 'error')
  }
}

const editProject = (project: Project) => {
  editingProjectId.value = project.id ?? null
  projectForm.title = project.title
  projectForm.description = project.description || ''
  projectForm.tech_stack_raw = project.tech_stack ? project.tech_stack.join(', ') : ''
  projectForm.demo_url = project.demo_url || ''
  projectForm.repo_url = project.repo_url || ''
  projectForm.cover_image = project.cover_image || ''
  
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetProjectForm = () => {
  editingProjectId.value = null
  Object.assign(projectForm, {
    title: '',
    description: '',
    tech_stack_raw: '',
    demo_url: '',
    repo_url: '',
    cover_image: ''
  })
}

const handleDeleteProject = async (id?: number) => {
  if (!id || !confirm('Yakin ingin menghapus proyek ini?')) return
  try {
    await deleteProject(id)
    showStatus('Proyek berhasil dihapus.')
    projectsList.value = await getProjects()
  } catch (err: any) {
    showStatus('Gagal menghapus proyek: ' + err.message, 'error')
  }
}

// --- BLOGS CRUD & UNIQUE SLUG HANDLER ---
const generateSlug = (forced: boolean = false) => {
  if (editingBlogId.value && !forced && isSlugManuallyModified.value) return
  
  blogForm.slug = blogForm.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  if (!forced) {
    isSlugManuallyModified.value = false
  }
}

const ensureUniqueSlug = (baseSlug: string, currentId: number | null): string => {
  let slug = baseSlug
  let counter = 1

  const isSlugTaken = (s: string) => {
    return blogsList.value.some(blog => blog.slug === s && blog.id !== currentId)
  }

  while (isSlugTaken(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

watch(() => blogForm.title, () => {
  if (!isSlugManuallyModified.value) {
    generateSlug(false)
  }
})

const handleSlugInput = () => {
  isSlugManuallyModified.value = true
}

const handleSaveBlog = async () => {
  if (!blogForm.title || !blogForm.slug || !blogForm.content) {
    return showStatus('Judul, slug, dan konten wajib diisi.', 'error')
  }

  const finalSlug = ensureUniqueSlug(blogForm.slug, editingBlogId.value)
  if (finalSlug !== blogForm.slug) {
    blogForm.slug = finalSlug
    showStatus(`Slug sama terdeteksi, otomatis disesuaikan menjadi: ${finalSlug}`, 'success')
  }

  try {
    const payload = {
      title: blogForm.title,
      slug: blogForm.slug,
      content: blogForm.content,
      cover_image: blogForm.cover_image || undefined,
      is_published: blogForm.is_published
    }

    if (editingBlogId.value) {
      await updateBlog(editingBlogId.value, payload)
      showStatus('Artikel blog berhasil diperbarui.')
    } else {
      await addBlog(payload)
      showStatus('Artikel blog berhasil dibuat.')
    }

    resetBlogForm()
    blogsList.value = await getBlogs()
  } catch (err: any) {
    showStatus('Gagal menyimpan blog: ' + err.message, 'error')
  }
}

const editBlog = (blog: Blog) => {
  editingBlogId.value = blog.id ?? null
  blogForm.title = blog.title
  blogForm.slug = blog.slug
  blogForm.content = blog.content
  blogForm.cover_image = blog.cover_image || ''
  blogForm.is_published = blog.is_published
  isSlugManuallyModified.value = true 
  
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetBlogForm = () => {
  editingBlogId.value = null
  isSlugManuallyModified.value = false
  Object.assign(blogForm, {
    title: '',
    slug: '',
    content: '',
    cover_image: '',
    is_published: false
  })
}

const toggleBlogPublish = async (blog: Blog) => {
  if (!blog.id) return
  try {
    await updateBlog(blog.id, { is_published: !blog.is_published })
    showStatus(`Status publikasi "${blog.title}" diperbarui.`)
    blogsList.value = await getBlogs()
  } catch (err: any) {
    showStatus('Gagal memperbarui status: ' + err.message, 'error')
  }
}

const handleDeleteBlog = async (id?: number) => {
  if (!id || !confirm('Yakin ingin menghapus artikel blog ini?')) return
  try {
    await deleteBlog(id)
    showStatus('Artikel blog dihapus.')
    blogsList.value = await getBlogs()
  } catch (err: any) {
    showStatus('Gagal menghapus blog: ' + err.message, 'error')
  }
}

const handleContentUpdate = (content: string) => {
  blogForm.content = content
}

// --- ADS CRUD ---
const fetchAds = async () => {
  try {
    const { data, error } = await supabase.from('ads').select('*').order('id', { ascending: false })
    if (error) throw error
    adsList.value = data || []
  } catch (err: any) {
    console.error('Gagal memuat daftar iklan:', err.message)
  }
}

const handleSaveAd = async () => {
  if (!adForm.title) return showStatus('Judul iklan wajib diisi.', 'error')

  try {
    const payload = {
      title: adForm.title,
      image_url: adForm.image_url || null,
      target_url: adForm.target_url || null,
      position: adForm.position,
      is_active: adForm.is_active,
      description: adForm.description || null,
      button_text: adForm.button_text || null
    }

    if (editingAdId.value) {
      const { error } = await supabase.from('ads').update(payload).eq('id', editingAdId.value)
      if (error) throw error
      showStatus('Iklan berhasil diperbarui.')
    } else {
      const { error } = await supabase.from('ads').insert([payload])
      if (error) throw error
      showStatus('Iklan berhasil ditambahkan.')
    }

    resetAdForm()
    await fetchAds()
  } catch (err: any) {
    showStatus('Gagal menyimpan iklan: ' + err.message, 'error')
  }
}

const editAd = (ad: Ad) => {
  editingAdId.value = ad.id ?? null
  adForm.title = ad.title
  adForm.image_url = ad.image_url || ''
  adForm.target_url = ad.target_url || ''
  adForm.position = ad.position || ''
  adForm.is_active = ad.is_active
  adForm.description = ad.description || ''
  adForm.button_text = ad.button_text || ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetAdForm = () => {
  editingAdId.value = null
  Object.assign(adForm, {
    title: '',
    image_url: '',
    target_url: '',
    position: '',
    is_active: true,
    description: '',
    button_text: ''
  })
}

const toggleAdStatus = async (ad: Ad) => {
  if (!ad.id) return
  try {
    const { error } = await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
    if (error) throw error
    showStatus(`Status iklan "${ad.title}" diperbarui.`)
    await fetchAds()
  } catch (err: any) {
    showStatus('Gagal memperbarui status iklan: ' + err.message, 'error')
  }
}

const handleDeleteAd = async (id?: number) => {
  if (!id || !confirm('Yakin ingin menghapus iklan ini?')) return
  try {
    const { error } = await supabase.from('ads').delete().eq('id', id)
    if (error) throw error
    showStatus('Iklan berhasil dihapus.')
    await fetchAds()
  } catch (err: any) {
    showStatus('Gagal menghapus iklan: ' + err.message, 'error')
  }
}

onMounted(() => {
  // Cek tema dari localStorage atau preferensi sistem
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark')
  }

  isAuthenticated.value = true
  loadAllData()
  checkMfaStatus()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
    
    <!-- Dashboard -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 class="text-xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Dashboard Panel
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm">Pengaturan konten portofolio, iklan, dan keamanan</p>
        </div>
        <div class="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            @click="handleLogout"
            class="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-sm font-medium"
          >
            <LogOut class="w-4 h-4" />
            Keluar
          </button>
        </div>
      </header>

      <!-- Status Message Alert -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
        <div v-if="statusMessage" class="mt-4 p-3.5 rounded-lg text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{{ statusMessage.text }}</span>
          </div>
        </div>
      </transition>

      <!-- Tab Navigation -->
      <nav class="flex gap-1 mt-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          v-for="tab in [
            { id: 'analytics', label: 'Analitik', icon: LayoutDashboard },
            { id: 'profile', label: 'Profil & Kontak', icon: User },
            { id: 'projects', label: 'Proyek', icon: FolderKanban },
            { id: 'blogs', label: 'Blog', icon: FileText },
            { id: 'ads', label: 'Kelola Iklan', icon: Megaphone },
            { id: 'security', label: 'Keamanan Akun', icon: Shield }
          ]"
          :key="tab.id"
          @click="activeTab = tab.id as any"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap"
          :class="activeTab === tab.id ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- Tab Content Container -->
      <div class="mt-6">
        <!-- Analytics -->
        <div v-if="activeTab === 'analytics'">
          <AnalyticsDashboard :projects="projectsList" :blogs="blogsList" :ads="adsList" />
        </div>

        <!-- Profile -->
        <div v-if="activeTab === 'profile'">
          <form @submit.prevent="handleSaveProfileAndContact" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Informasi Profil</h3>
              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap</label>
                  <input type="text" v-model="profileForm.full_name" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Jabatan / Headline</label>
                  <input type="text" v-model="profileForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Avatar</label>
                  <input type="url" v-model="profileForm.avatar_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bio Singkat</label>
                  <textarea v-model="profileForm.bio" rows="4" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 resize-none"></textarea>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-sm">
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Kontak & Tautan</h3>
                <div class="space-y-3.5">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email Publik</label>
                    <input type="email" v-model="contactForm.email" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telepon / WhatsApp</label>
                    <input type="text" v-model="contactForm.phone" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">GitHub URL</label>
                    <input type="url" v-model="contactForm.github_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">LinkedIn URL</label>
                    <input type="url" v-model="contactForm.linkedin_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                  </div>
                </div>
              </div>
              <button type="submit" :disabled="loading" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Check class="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        <!-- Projects -->
        <div v-if="activeTab === 'projects'" class="space-y-6">
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FolderKanban class="w-4 h-4 text-emerald-600" />
                {{ editingProjectId ? 'Edit Proyek' : 'Tambah Proyek' }}
              </h3>
              <button v-if="editingProjectId" @click="resetProjectForm" type="button" class="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline">
                Batal Edit
              </button>
            </div>

            <form @submit.prevent="handleSaveProject" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Judul Proyek</label>
                  <input type="text" v-model="projectForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tech Stack (pisahkan koma)</label>
                  <input type="text" v-model="projectForm.tech_stack_raw" placeholder="Vue, Tailwind, Supabase" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Deskripsi</label>
                <textarea v-model="projectForm.description" rows="3" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Cover Image</label>
                  <input type="url" v-model="projectForm.cover_image" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Demo</label>
                  <input type="url" v-model="projectForm.demo_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Repository</label>
                  <input type="url" v-model="projectForm.repo_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button type="submit" :disabled="loading" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2">
                  <component :is="editingProjectId ? Check : Plus" class="w-4 h-4" />
                  {{ editingProjectId ? 'Simpan Perubahan' : 'Tambah Proyek' }}
                </button>
                <button v-if="editingProjectId" @click="resetProjectForm" type="button" class="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Batal
                </button>
              </div>
            </form>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <!-- Baris Aksi Massal -->
            <div v-if="selectedProjects.length > 0" class="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between transition-all">
              <span class="text-xs font-medium text-emerald-800 dark:text-emerald-300">{{ selectedProjects.length }} proyek dipilih</span>
              <button @click="handleBulkDeleteProjects" class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition shadow-xs">
                <Trash2 class="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>
            </div>

            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">Daftar Proyek</h3>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ projectsList.length }} item</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="w-10 px-6 py-3">
                      <input 
                        type="checkbox" 
                        @change="toggleSelectAll" 
                        :checked="isAllSelected" 
                        :indeterminate="isIndeterminate"
                        class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Judul</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Tech Stack</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="project in projectsList" :key="project.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td class="w-10 px-6 py-4">
                      <input 
                        type="checkbox" 
                        :value="project.id" 
                        v-model="selectedProjects" 
                        class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{{ project.title }}</td>
                    <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <div class="flex flex-wrap gap-1">
                        <span v-for="tech in project.tech_stack" :key="tech" class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                          {{ tech }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right space-x-2">
                      <button @click="editProject(project)" class="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition" title="Edit">
                        <Edit class="w-4 h-4 inline" />
                      </button>
                      <button @click="handleDeleteProject(project.id)" class="p-1 text-slate-600 dark:text-slate-400 hover:text-red-600 transition" title="Hapus">
                        <Trash2 class="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="projectsList.length === 0">
                    <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada proyek tersedia.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Blogs -->
        <div v-if="activeTab === 'blogs'" class="space-y-6">
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText class="w-4 h-4 text-emerald-600" />
                {{ editingBlogId ? 'Edit Artikel Blog' : 'Buat Artikel Baru' }}
              </h3>
              <button v-if="editingBlogId" @click="resetBlogForm" type="button" class="text-xs text-slate-500 dark:text-slate-400 hover:underline">
                Batal Edit
              </button>
            </div>

            <form @submit.prevent="handleSaveBlog" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Judul Artikel</label>
                  <input type="text" v-model="blogForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Slug URL</label>
                  <input type="text" v-model="blogForm.slug" @input="handleSlugInput" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Gambar Sampul</label>
                  <input type="url" v-model="blogForm.cover_image" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div class="flex items-center pt-5">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="blogForm.is_published" class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                    <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Publikasikan Langsung</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Konten Artikel</label>
                <TipTapEditor :modelValue="blogForm.content" @update:modelValue="handleContentUpdate" />
              </div>
              <div class="flex gap-2 pt-2">
                <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition flex items-center gap-2">
                  <Check class="w-4 h-4" />
                  {{ editingBlogId ? 'Simpan Perubahan' : 'Terbitkan Artikel' }}
                </button>
                <button v-if="editingBlogId" @click="resetBlogForm" type="button" class="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Batal
                </button>
              </div>
            </form>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div v-if="selectedBlogs.length > 0" class="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between transition-all">
              <span class="text-xs font-medium text-emerald-800 dark:text-emerald-300">{{ selectedBlogs.length }} artikel dipilih</span>
              <button @click="handleBulkDeleteBlogs" class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition shadow-xs">
                <Trash2 class="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>
            </div>

            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">Daftar Artikel Blog</h3>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ blogsList.length }} item</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="w-10 px-6 py-3">
                      <input 
                        type="checkbox" 
                        @change="toggleSelectAllBlogs" 
                        :checked="isAllBlogsSelected" 
                        :indeterminate="isBlogsIndeterminate"
                        class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Judul</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Status</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="blog in blogsList" :key="blog.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td class="w-10 px-6 py-4">
                      <input 
                        type="checkbox" 
                        :value="blog.id" 
                        v-model="selectedBlogs" 
                        class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{{ blog.title }}</td>
                    <td class="px-6 py-4">
                      <button @click="toggleBlogPublish(blog)" class="px-2.5 py-1 text-xs font-medium rounded-full transition" :class="blog.is_published ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'">
                        {{ blog.is_published ? 'Published' : 'Draft' }}
                      </button>
                    </td>
                    <td class="px-6 py-4 text-right space-x-2">
                      <button @click="editBlog(blog)" class="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition" title="Edit">
                        <Edit class="w-4 h-4 inline" />
                      </button>
                      <button @click="handleDeleteBlog(blog.id)" class="p-1 text-slate-600 dark:text-slate-400 hover:text-red-600 transition" title="Hapus">
                        <Trash2 class="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="blogsList.length === 0">
                    <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada artikel blog.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Ads -->
        <div v-if="activeTab === 'ads'" class="space-y-6">
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Megaphone class="w-4 h-4 text-emerald-600" />
                {{ editingAdId ? 'Edit Iklan' : 'Tambah Slot Iklan' }}
              </h3>
              <button v-if="editingAdId" @click="resetAdForm" type="button" class="text-xs text-slate-500 dark:text-slate-400 hover:underline">
                Batal Edit
              </button>
            </div>

            <form @submit.prevent="handleSaveAd" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Judul / Nama Iklan</label>
                  <input type="text" v-model="adForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Posisi Slot</label>
                  <select v-model="adForm.position" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required>
                    <option value="" disabled>Pilih posisi...</option>
                    <option value="header">Header</option>
                    <option value="footer">Footer</option>
                    <option value="content_inline">Inline Konten</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Gambar Banner</label>
                  <input type="url" v-model="adForm.image_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL Tautan Tujuan (Target URL)</label>
                  <input type="url" v-model="adForm.target_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Teks Tombol (Button Text)</label>
                  <input type="text" v-model="adForm.button_text" placeholder="Contoh: Beli Sekarang" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
                </div>
                <div class="flex items-center pt-5">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="adForm.is_active" class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                    <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Aktifkan Iklan Ini</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Deskripsi Singkat / Catatan</label>
                <textarea v-model="adForm.description" rows="2" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 resize-none"></textarea>
              </div>
              <div class="flex gap-2 pt-2">
                <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition flex items-center gap-2">
                  <Check class="w-4 h-4" />
                  {{ editingAdId ? 'Simpan Perubahan' : 'Tambah Iklan' }}
                </button>
                <button v-if="editingAdId" @click="resetAdForm" type="button" class="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Batal
                </button>
              </div>
            </form>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div v-if="selectedAds.length > 0" class="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between transition-all">
              <span class="text-xs font-medium text-emerald-800 dark:text-emerald-300">{{ selectedAds.length }} iklan dipilih</span>
              <button @click="handleBulkDeleteAds" class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition shadow-xs">
                <Trash2 class="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>
            </div>

            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">Daftar Slot Iklan</h3>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ adsList.length }} item</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="w-10 px-6 py-3">
                      <input 
                        type="checkbox" 
                        @change="toggleSelectAllAds" 
                        :checked="isAllAdsSelected" 
                        :indeterminate="isAdsIndeterminate"
                        class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Judul</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Posisi</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Status</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="ad in adsList" :key="ad.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td class="w-10 px-6 py-4">
                      <input 
                        type="checkbox" 
                        :value="ad.id" 
                        v-model="selectedAds" 
                        class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{{ ad.title }}</td>
                    <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 capitalize">
                      <span class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">{{ ad.position }}</span>
                    </td>
                    <td class="px-6 py-4">
                      <button @click="toggleAdStatus(ad)" class="px-2.5 py-1 text-xs font-medium rounded-full transition" :class="ad.is_active ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'">
                        {{ ad.is_active ? 'Active' : 'Inactive' }}
                      </button>
                    </td>
                    <td class="px-6 py-4 text-right space-x-2">
                      <button @click="editAd(ad)" class="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition" title="Edit">
                        <Edit class="w-4 h-4 inline" />
                      </button>
                      <button @click="handleDeleteAd(ad.id)" class="p-1 text-slate-600 dark:text-slate-400 hover:text-red-600 transition" title="Hapus">
                        <Trash2 class="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="adsList.length === 0">
                    <td colspan="5" class="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Belum ada data iklan.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div v-if="activeTab === 'security'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Ganti Password -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <KeyRound class="w-4 h-4 text-emerald-600" />
                Ganti Password Akun
              </h3>
              <form @submit.prevent="handleUpdatePassword" class="space-y-3.5">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password Lama</label>
                  <input type="password" v-model="passwordForm.oldPassword" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password Baru</label>
                  <input type="password" v-model="passwordForm.newPassword" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Konfirmasi Password Baru</label>
                  <input type="password" v-model="passwordForm.confirmPassword" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" required />
                </div>
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition mt-2">
                  Perbarui Password
                </button>
              </form>
            </div>

            <!-- Autentikasi 2 Faktor (2FA) -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-sm">
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Shield class="w-4 h-4 text-emerald-600" />
                  Autentikasi 2 Faktor (2FA)
                </h3>
                
                <div v-if="mfaEnabled" class="space-y-3">
                  <div class="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Check class="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>2FA Aktif. Akun Anda terlindungi dengan kode verifikasi authenticator.</span>
                  </div>
                  <button @click="disableMfa" class="w-full px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-sm font-medium transition">
                    Nonaktifkan 2FA
                  </button>
                </div>

                <div v-else class="space-y-3">
                  <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tingkatkan keamanan akun admin Anda menggunakan aplikasi Authenticator (Google Authenticator, Authy, dll).
                  </p>

                  <div v-if="mfaEnrollmentData" class="space-y-3 pt-2">
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                      <div class="bg-white p-2 rounded-lg shadow-xs mb-2">
                        <img :src="mfaEnrollmentData.qrCode" alt="QR Code 2FA" class="w-36 h-36" />
                      </div>
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 break-all">Secret: {{ mfaEnrollmentData.secret }}</span>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Masukkan Kode 6 Digit</label>
                      <input type="text" v-model="enrollCode" placeholder="123456" maxlength="6" class="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 tracking-widest text-center" />
                    </div>
                    <button @click="verifyMfaEnrollment" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition">
                      Verifikasi & Aktifkan
                    </button>
                  </div>

                  <button v-else @click="startMfaEnrollment" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                    <QrCode class="w-4 h-4" />
                    Mulai Setup 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>