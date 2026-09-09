<!-- views/LoginView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { 
  Mail, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  EyeOff 
} from 'lucide-vue-next'

const router = useRouter()
const email = ref<string>('')
const password = ref<string>('')
const showPassword = ref<boolean>(false)
const mfaCode = ref<string>('')
const loading = ref<boolean>(false)
const errorMessage = ref<string | null>(null)
const isMfaRequired = ref<boolean>(false)

// Cek sesi aktif saat komponen dimuat; jika sudah login, langsung arahkan ke admin
onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    router.push('/admin')
  }
})

const handleLogin = async (): Promise<void> => {
  loading.value = true
  errorMessage.value = null

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    loading.value = false
    errorMessage.value = error.message
    return
  }

  // Periksa level jaminan keamanan (AAL) untuk mendeteksi apakah 2FA aktif
  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  loading.value = false

  if (aal.error) {
    errorMessage.value = aal.error.message
    return
  }

  if (aal.data && aal.data.nextLevel === 'aal2' && aal.data.currentLevel !== aal.data.nextLevel) {
    // 2FA diperlukan, tampilkan form input kode TOTP
    isMfaRequired.value = true
  } else {
    // Tidak ada 2FA, langsung arahkan ke dashboard admin
    router.push('/admin')
  }
}

const handleVerifyMfa = async (): Promise<void> => {
  loading.value = true
  errorMessage.value = null

  try {
    const factors = await supabase.auth.mfa.listFactors()
    if (factors.error) throw factors.error

    const totpFactor = factors.data.totp.find(f => (f as any).status === 'verified')
    if (!totpFactor) throw new Error('Faktor TOTP tidak ditemukan.')

    const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
    if (challenge.error) throw challenge.error

    const { error } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.data.id,
      code: mfaCode.value,
    })
    if (error) throw error

    // Verifikasi 2FA berhasil, arahkan ke admin
    router.push('/admin')
  } catch (err: any) {
    errorMessage.value = err.message || 'Kode verifikasi salah atau kedaluwarsa.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-[80vh] text-slate-800 dark:text-slate-100 font-sans flex items-center justify-center px-4 transition-colors duration-300">
    <div class="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
      
      <!-- Form Login Standar (Email & Password) -->
      <div v-if="!isMfaRequired">
        <div class="mb-6">
          <h1 class="text-xl font-medium text-slate-900 dark:text-white tracking-tight">Kredensial Admin</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Masuk untuk mengelola situs</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Error Box -->
          <div v-if="errorMessage" class="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Email</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail class="w-4 h-4" />
              </span>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="admin@domain.com"
                class="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none transition bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock class="w-4 h-4" />
              </span>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none transition bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer mt-2"
          >
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </div>

      <!-- Form Verifikasi 2FA (TOTP) -->
      <div v-else>
        <div class="mb-6">
          <h1 class="text-xl font-medium text-slate-900 dark:text-white tracking-tight">Verifikasi 2FA</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Masukkan 6 digit kode dari aplikasi authenticator Anda</p>
        </div>

        <form @submit.prevent="handleVerifyMfa" class="space-y-4">
          <!-- Error Box -->
          <div v-if="errorMessage" class="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">Kode TOTP</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                <KeyRound class="w-4 h-4" />
              </span>
              <input
                id="mfaCode"
                v-model="mfaCode"
                type="text"
                placeholder="000000"
                maxlength="6"
                class="w-full py-2 text-sm text-center font-mono tracking-widest border border-slate-200 dark:border-slate-700 rounded-lg focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none transition bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer mt-2"
          >
            {{ loading ? 'Memproses...' : 'Verifikasi & Masuk' }}
          </button>

          <button
            type="button"
            @click="isMfaRequired = false; mfaCode = ''; errorMessage = null;"
            class="inline-flex items-center justify-center gap-1.5 w-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs py-1.5 transition text-center cursor-pointer"
          >
            <ArrowLeft class="w-3.5 h-3.5" /> Kembali ke Login
          </button>
        </form>
      </div>

    </div>
  </main>
</template>