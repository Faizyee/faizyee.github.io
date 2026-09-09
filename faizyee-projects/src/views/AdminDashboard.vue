<!-- views/AdminDashboard.vue -->
<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { usePortfolio } from '../composables/usePortfolio'
import type { Profile, Contact, Project, Blog } from '../types/portfolio'
import TipTapEditor from '../components/TipTapEditor.vue'
import AnalyticsDashboard from '../components/AnalyticsDashboard.vue'

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

  // Contoh eksekusi ke Supabase:
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

// Cek apakah seluruh artikel sedang terpilih
const isAllBlogsSelected = computed(() => {
  return blogsList.value.length > 0 && selectedBlogs.value.length === blogsList.value.length
})

// Cek apakah sebagian artikel terpilih (indikator garis tengah / indeterminate)
const isBlogsIndeterminate = computed(() => {
  return selectedBlogs.value.length > 0 && selectedBlogs.value.length < blogsList.value.length
})

// Fungsi untuk memilih atau membatalkan pilihan semua artikel
const toggleSelectAllBlogs = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedBlogs.value = blogsList.value.map(blog => blog.id)
  } else {
    selectedBlogs.value = []
  }
}

// Fungsi contoh untuk hapus massal (Bulk Delete) artikel blog
const handleBulkDeleteBlogs = async () => {
  if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedBlogs.value.length} artikel terpilih?`)) return

  // Sesuaikan dengan logic Supabase Anda, contoh:
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

// Cek apakah seluruh iklan sedang terpilih
const isAllAdsSelected = computed(() => {
  return adsList.value.length > 0 && selectedAds.value.length === adsList.value.length
})

// Cek apakah sebagian iklan terpilih (indikator garis tengah / indeterminate)
const isAdsIndeterminate = computed(() => {
  return selectedAds.value.length > 0 && selectedAds.value.length < adsList.value.length
})

// Fungsi untuk memilih atau membatalkan pilihan semua iklan
const toggleSelectAllAds = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedAds.value = adsList.value.map(ad => ad.id)
  } else {
    selectedAds.value = []
  }
}

// Fungsi contoh untuk hapus massal (Bulk Delete) iklan
const handleBulkDeleteAds = async () => {
  if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedAds.value.length} iklan terpilih?`)) return

  // Sesuaikan dengan logic Supabase Anda, contoh:
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
const isAuthenticated = ref<boolean>(false)
const isMfaRequired = ref<boolean>(false)
const email = ref<string>('')
const password = ref<string>('')
const mfaLoginCode = ref<string>('')
const authError = ref<string>('')

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
const checkSession = async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal.data && aal.data.nextLevel === 'aal2' && aal.data.currentLevel !== aal.data.nextLevel) {
      isMfaRequired.value = true
      isAuthenticated.value = true
    } else {
      isAuthenticated.value = true
      isMfaRequired.value = false
      loadAllData()
      checkMfaStatus()
    }
  }
}

const handleLogin = async () => {
  authError.value = ''
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    authError.value = error.message
    return
  }

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal.data && aal.data.nextLevel === 'aal2' && aal.data.currentLevel !== aal.data.nextLevel) {
    isMfaRequired.value = true
    isAuthenticated.value = true
  } else {
    isAuthenticated.value = true
    isMfaRequired.value = false
    loadAllData()
    checkMfaStatus()
  }
}

const handleVerifyLoginMfa = async () => {
  authError.value = ''
  try {
    const factors = await supabase.auth.mfa.listFactors()
    if (factors.error) throw factors.error
    const totpFactor = factors.data.totp.find(f => f.status === 'verified')
    if (!totpFactor) throw new Error('Faktor TOTP tidak ditemukan.')

    const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
    if (challenge.error) throw challenge.error

    const { error } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.data.id,
      code: mfaLoginCode.value
    })
    if (error) throw error

    isMfaRequired.value = false
    mfaLoginCode.value = ''
    loadAllData()
    checkMfaStatus()
    showStatus('Berhasil masuk dengan Autentikasi 2 Faktor.')
  } catch (err: any) {
    authError.value = err.message || 'Kode verifikasi salah.'
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  isAuthenticated.value = false
  isMfaRequired.value = false
  mfaEnrollmentData.value = null
  clearData()
  ;['has_loaded_portfolio', 'has_loaded_projects', 'has_loaded_blogs'].forEach(key => {
    sessionStorage.removeItem(key)
  })
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
  checkSession()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans">
    
    <!-- Login View -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div class="mb-6">
          <h1 class="text-xl font-medium text-slate-900 tracking-tight">Admin Area</h1>
          <p class="text-slate-500 text-sm mt-1">Masukkan kredensial untuk melanjutkan</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              v-model="email"
              class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/50"
              required
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              v-model="password"
              class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/50"
              required
            />
          </div>

          <p v-if="authError" class="text-slate-700 text-xs bg-slate-100 p-3 rounded-lg border border-slate-200">{{ authError }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </div>
    </div>

    <!-- MFA Challenge View -->
    <div v-else-if="isMfaRequired" class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div class="mb-6">
          <h1 class="text-xl font-medium text-slate-900 tracking-tight">Verifikasi 2FA</h1>
          <p class="text-slate-500 text-sm mt-1">Masukkan 6 digit kode dari aplikasi authenticator Anda</p>
        </div>

        <form @submit.prevent="handleVerifyLoginMfa" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Kode TOTP</label>
            <input
              type="text"
              v-model="mfaLoginCode"
              placeholder="123456"
              maxlength="6"
              class="w-full px-3.5 py-2 text-sm text-center font-mono tracking-widest border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/50"
              required
            />
          </div>

          <p v-if="authError" class="text-slate-700 text-xs bg-slate-100 p-3 rounded-lg border border-slate-200">{{ authError }}</p>

          <button
            type="submit"
            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition"
          >
            Verifikasi & Masuk
          </button>
          <button
            type="button"
            @click="handleLogout"
            class="w-full text-slate-500 hover:text-slate-800 text-xs py-1.5 transition text-center"
          >
            Kembali ke Login
          </button>
        </form>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 class="text-xl font-medium text-slate-900 tracking-tight">Dashboard Panel</h1>
          <p class="text-slate-500 text-sm">Pengaturan konten portofolio, iklan, dan keamanan</p>
        </div>
        <button
          @click="handleLogout"
          class="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm font-medium self-start sm:self-auto"
        >
          Keluar
        </button>
      </header>

      <!-- Status Message Alert -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
        <div v-if="statusMessage" class="mt-4 p-3.5 rounded-lg text-sm border bg-white border-slate-200 text-slate-700 shadow-xs flex items-center justify-between">
          <span>{{ statusMessage.text }}</span>
        </div>
      </transition>

      <!-- Tab Navigation -->
      <nav class="flex gap-1 mt-6 border-b border-slate-200 overflow-x-auto">
        <button
          v-for="tab in ['analytics', 'profile', 'projects', 'blogs', 'ads', 'security']"
          :key="tab"
          @click="activeTab = tab as any"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize whitespace-nowrap"
          :class="activeTab === tab ? 'border-emerald-600 text-emerald-700 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <span v-if="tab === 'analytics'">Analitik</span>
          <span v-else-if="tab === 'profile'">Profil & Kontak</span>
          <span v-else-if="tab === 'projects'">Proyek</span>
          <span v-else-if="tab === 'blogs'">Blog</span>
          <span v-else-if="tab === 'ads'">Kelola Iklan</span>
          <span v-else>Keamanan Akun</span>
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
            <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Informasi Profil</h3>
              <div class="space-y-3.5">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap</label>
                  <input type="text" v-model="profileForm.full_name" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Jabatan / Headline</label>
                  <input type="text" v-model="profileForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">URL Avatar</label>
                  <input type="url" v-model="profileForm.avatar_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Bio Singkat</label>
                  <textarea v-model="profileForm.bio" rows="4" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 resize-none"></textarea>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Kontak & Tautan</h3>
                <div class="space-y-3.5">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Email Publik</label>
                    <input type="email" v-model="contactForm.email" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Telepon / WhatsApp</label>
                    <input type="text" v-model="contactForm.phone" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">GitHub URL</label>
                    <input type="url" v-model="contactForm.github_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
                    <input type="url" v-model="contactForm.linkedin_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                  </div>
                </div>
              </div>
              <button type="submit" :disabled="loading" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        <!-- Projects -->
        <div v-if="activeTab === 'projects'" class="space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider">
                {{ editingProjectId ? 'Edit Proyek' : 'Tambah Proyek' }}
              </h3>
              <button v-if="editingProjectId" @click="resetProjectForm" type="button" class="text-xs text-slate-500 hover:text-slate-800 underline">
                Batal Edit
              </button>
            </div>

            <form @submit.prevent="handleSaveProject" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Judul Proyek</label>
                  <input type="text" v-model="projectForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Tech Stack (pisahkan koma)</label>
                  <input type="text" v-model="projectForm.tech_stack_raw" placeholder="Vue, Tailwind, Supabase" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Deskripsi</label>
                <textarea v-model="projectForm.description" rows="3" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">URL Cover Image</label>
                  <input type="url" v-model="projectForm.cover_image" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">URL Demo</label>
                  <input type="url" v-model="projectForm.demo_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">URL Repository</label>
                  <input type="url" v-model="projectForm.repo_url" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button type="submit" :disabled="loading" class="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
                  {{ editingProjectId ? 'Simpan Perubahan' : 'Tambah Proyek' }}
                </button>
                <button v-if="editingProjectId" @click="resetProjectForm" type="button" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Batal
                </button>
              </div>
            </form>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <!-- Baris Aksi Massal (Muncul jika ada yang dipilih) -->
            <div v-if="selectedProjects.length > 0" class="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between transition-all">
              <span class="text-xs font-medium text-emerald-800">{{ selectedProjects.length }} proyek dipilih</span>
              <button @click="handleBulkDeleteProjects" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition shadow-xs">
                Hapus Terpilih
              </button>
            </div>

            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider">Daftar Proyek</h3>
              <span class="text-xs text-slate-500">{{ projectsList.length }} item</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="w-10 px-6 py-3">
                      <input 
                        type="checkbox" 
                        @change="toggleSelectAll" 
                        :checked="isAllSelected" 
                        :indeterminate="isIndeterminate"
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Judul</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Tech Stack</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="projectsList.length === 0">
                    <td colspan="4" class="px-6 py-10 text-center text-slate-400 text-sm">Belum ada proyek.</td>
                  </tr>
                  <tr 
                    v-for="item in projectsList" 
                    :key="item.id" 
                    class="hover:bg-slate-50/50 transition"
                    :class="{ 'bg-emerald-50/30': selectedProjects.includes(item.id) }"
                  >
                    <td class="w-10 px-6 py-3.5">
                      <input 
                        type="checkbox" 
                        v-model="selectedProjects" 
                        :value="item.id" 
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    <td class="px-6 py-3.5 text-sm text-slate-900 font-medium">{{ item.title }}</td>
                    <td class="px-6 py-3.5">
                      <div class="flex flex-wrap gap-1">
                        <span v-for="t in item.tech_stack" :key="t" class="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200">{{ t }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-3.5 text-right space-x-3 text-sm">
                      <button @click="editProject(item)" class="text-slate-700 hover:text-slate-900 font-medium">Edit</button>
                      <button @click="handleDeleteProject(item.id)" class="text-slate-400 hover:text-red-600 font-medium">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Blogs -->
        <div v-if="activeTab === 'blogs'" class="space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider">
                {{ editingBlogId ? 'Edit Artikel' : 'Tulis Artikel' }}
              </h3>
              <button v-if="editingBlogId" @click="resetBlogForm" type="button" class="text-xs text-slate-500 hover:text-slate-800 underline">
                Batal Edit
              </button>
            </div>

            <form @submit.prevent="handleSaveBlog" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Judul Artikel</label>
                  <input type="text" v-model="blogForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-medium text-slate-600">Slug URL</label>
                    <button type="button" @click="generateSlug(true)" class="text-[10px] text-emerald-700 hover:underline">Generate Ulang</button>
                  </div>
                  <input type="text" v-model="blogForm.slug" @input="handleSlugInput" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30 font-mono text-xs" required />
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">URL Gambar Sampul</label>
                <input type="url" v-model="blogForm.cover_image" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Konten Artikel</label>
                <TipTapEditor :modelValue="blogForm.content" @update:modelValue="handleContentUpdate" />
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_published" v-model="blogForm.is_published" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <label for="is_published" class="text-xs font-medium text-slate-700">Publikasikan sekarang</label>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" :disabled="loading" class="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
                  {{ editingBlogId ? 'Simpan Perubahan' : 'Buat Artikel' }}
                </button>
                <button v-if="editingBlogId" @click="resetBlogForm" type="button" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Batal
                </button>
              </div>
            </form>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <!-- Baris Aksi Massal (Muncul jika ada artikel yang dipilih) -->
            <div v-if="selectedBlogs.length > 0" class="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between transition-all">
              <span class="text-xs font-medium text-emerald-800">{{ selectedBlogs.length }} artikel dipilih</span>
              <button @click="handleBulkDeleteBlogs" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition shadow-xs">
                Hapus Terpilih
              </button>
            </div>

            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider">Daftar Artikel Blog</h3>
              <span class="text-xs text-slate-500">{{ blogsList.length }} artikel</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="w-10 px-6 py-3">
                      <input 
                        type="checkbox" 
                        @change="toggleSelectAllBlogs" 
                        :checked="isAllBlogsSelected" 
                        :indeterminate="isBlogsIndeterminate"
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Judul</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="blogsList.length === 0">
                    <td colspan="4" class="px-6 py-10 text-center text-slate-400 text-sm">Belum ada artikel.</td>
                  </tr>
                  <tr 
                    v-for="blog in blogsList" 
                    :key="blog.id" 
                    class="hover:bg-slate-50/50 transition"
                    :class="{ 'bg-emerald-50/30': selectedBlogs.includes(blog.id) }"
                  >
                    <td class="w-10 px-6 py-3.5">
                      <input 
                        type="checkbox" 
                        v-model="selectedBlogs" 
                        :value="blog.id" 
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    <td class="px-6 py-3.5 text-sm text-slate-900 font-medium">{{ blog.title }}</td>
                    <td class="px-6 py-3.5">
                      <button @click="toggleBlogPublish(blog)" class="px-2.5 py-1 text-xs font-medium rounded-full transition" :class="blog.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'">
                        {{ blog.is_published ? 'Published' : 'Draft' }}
                      </button>
                    </td>
                    <td class="px-6 py-3.5 text-right space-x-3 text-sm">
                      <button @click="editBlog(blog)" class="text-slate-700 hover:text-slate-900 font-medium">Edit</button>
                      <button @click="handleDeleteBlog(blog.id)" class="text-slate-400 hover:text-red-600 font-medium">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Ads / Kelola Iklan -->
        <div v-if="activeTab === 'ads'" class="space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider">
                {{ editingAdId ? 'Edit Iklan' : 'Tambah Iklan Baru' }}
              </h3>
              <button v-if="editingAdId" @click="resetAdForm" type="button" class="text-xs text-slate-500 hover:text-slate-800 underline">
                Batal Edit
              </button>
            </div>

            <form @submit.prevent="handleSaveAd" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Judul / Nama Iklan</label>
                  <input type="text" v-model="adForm.title" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Posisi Slot Iklan</label>
                  <select v-model="adForm.position" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30">
                    <option value="header">Header Banner</option>
                    <option value="footer">Footer Banner</option>
                    <option value="in-content">Dalam Artikel</option>
                  </select>
                </div>
              </div>

              <!-- Input Deskripsi Iklan -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Deskripsi Iklan</label>
                <textarea v-model="adForm.description" rows="3" placeholder="Tuliskan deskripsi atau ringkasan penawaran iklan di sini..." class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30"></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">URL Gambar / Banner</label>
                  <input type="url" v-model="adForm.image_url" placeholder="https://example.com/banner.jpg" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">URL Tujuan (Target Link)</label>
                  <input type="url" v-model="adForm.target_url" placeholder="https://target-url.com" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                </div>
              </div>

              <!-- Input Teks Tombol / Button Text -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Teks Tombol (Opsional)</label>
                <input type="text" v-model="adForm.button_text" placeholder="Contoh: Pelajari Selengkapnya, Beli Sekarang, Kunjungi Website" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" />
                <p class="text-[11px] text-slate-400 mt-1">Jika dikosongkan, tombol akan otomatis menggunakan teks default (misal: "Pelajari Selengkapnya").</p>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" id="ad_is_active" v-model="adForm.is_active" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <label for="ad_is_active" class="text-xs font-medium text-slate-700">Aktifkan Iklan</label>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" :disabled="loading" class="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
                  {{ editingAdId ? 'Simpan Perubahan' : 'Tambah Iklan' }}
                </button>
                <button v-if="editingAdId" @click="resetAdForm" type="button" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Batal
                </button>
              </div>
            </form>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <!-- Baris Aksi Massal (Muncul jika ada iklan yang dipilih) -->
            <div v-if="selectedAds.length > 0" class="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between transition-all">
              <span class="text-xs font-medium text-emerald-800">{{ selectedAds.length }} iklan dipilih</span>
              <button @click="handleBulkDeleteAds" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition shadow-xs">
                Hapus Terpilih
              </button>
            </div>

            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider">Daftar Iklan</h3>
              <span class="text-xs text-slate-500">{{ adsList.length }} iklan</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="w-10 px-6 py-3">
                      <input 
                        type="checkbox" 
                        @change="toggleSelectAllAds" 
                        :checked="isAllAdsSelected" 
                        :indeterminate="isAdsIndeterminate"
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Judul</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Posisi</th>
                    <th class="px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="adsList.length === 0">
                    <td colspan="5" class="px-6 py-10 text-center text-slate-400 text-sm">Belum ada data iklan.</td>
                  </tr>
                  <tr 
                    v-for="ad in adsList" 
                    :key="ad.id" 
                    class="hover:bg-slate-50/50 transition"
                    :class="{ 'bg-emerald-50/30': selectedAds.includes(ad.id) }"
                  >
                    <td class="w-10 px-6 py-3.5">
                      <input 
                        type="checkbox" 
                        v-model="selectedAds" 
                        :value="ad.id" 
                        class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                    </td>
                    <td class="px-6 py-3.5 text-sm text-slate-900 font-medium">{{ ad.title }}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-600 capitalize">
                      <span class="px-2 py-1 bg-slate-100 rounded border border-slate-200">{{ ad.position }}</span>
                    </td>
                    <td class="px-6 py-3.5">
                      <button @click="toggleAdStatus(ad)" class="px-2.5 py-1 text-xs font-medium rounded-full transition" :class="ad.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'">
                        {{ ad.is_active ? 'Aktif' : 'Nonaktif' }}
                      </button>
                    </td>
                    <td class="px-6 py-3.5 text-right space-x-3 text-sm">
                      <button @click="editAd(ad)" class="text-slate-700 hover:text-slate-900 font-medium">Edit</button>
                      <button @click="handleDeleteAd(ad.id)" class="text-slate-400 hover:text-red-600 font-medium">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div v-if="activeTab === 'security'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Ganti Password Admin</h3>
            <form @submit.prevent="handleUpdatePassword" class="space-y-3.5">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Password Lama</label>
                <input type="password" v-model="passwordForm.oldPassword" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Password Baru</label>
                <input type="password" v-model="passwordForm.newPassword" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Konfirmasi Password Baru</label>
                <input type="password" v-model="passwordForm.confirmPassword" class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30" required />
              </div>
              <button type="submit" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition">
                Perbarui Password
              </button>
            </form>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 class="text-sm font-medium text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Autentikasi 2 Faktor (2FA)</h3>
            <div v-if="mfaEnabled" class="space-y-4">
              <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center justify-between">
                <span>Status: 2FA Aktif dan Diamankan</span>
              </div>
              <button @click="disableMfa" type="button" class="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-lg transition">
                Nonaktifkan 2FA
              </button>
            </div>

            <div v-else class="space-y-4">
              <p class="text-xs text-slate-500">Tingkatkan keamanan akun admin Anda dengan mengaktifkan verifikasi dua langkah menggunakan aplikasi Authenticator (Google Authenticator, Authy, dll).</p>
              
              <div v-if="!mfaEnrollmentData">
                <button @click="startMfaEnrollment" type="button" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition">
                  Mulai Pengaturan 2FA
                </button>
              </div>

              <div v-else class="space-y-4 pt-2 border-t border-slate-100">
                <div class="text-center">
                  <p class="text-xs text-slate-600 mb-2">Pindai QR Code ini menggunakan aplikasi Authenticator Anda:</p>
                  <div class="inline-block p-2 bg-white border border-slate-200 rounded-lg">
                    <img :src="mfaEnrollmentData.qrCode" alt="MFA QR Code" class="w-36 h-36 mx-auto" />
                  </div>
                  <p class="text-[10px] text-slate-400 mt-1 font-mono">Secret: {{ mfaEnrollmentData.secret }}</p>
                </div>

                <div class="space-y-2">
                  <label class="block text-xs font-medium text-slate-600">Masukkan Kode Verifikasi</label>
                  <input
                    type="text"
                    v-model="enrollCode"
                    placeholder="123456"
                    maxlength="6"
                    class="w-full px-3.5 py-2 text-sm text-center font-mono tracking-widest border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/30"
                  />
                  <button @click="verifyMfaEnrollment" type="button" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition">
                    Verifikasi & Aktifkan
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