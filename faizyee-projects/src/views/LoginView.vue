<!-- views/LoginView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const email = ref<string>('')
const password = ref<string>('')
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
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans flex items-center justify-center px-4">
    <div class="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
      
      <!-- Form Login Standar (Email & Password) -->
      <div v-if="!isMfaRequired">
        <div class="mb-6">
          <h1 class="text-xl font-medium text-slate-900 tracking-tight">Login Admin</h1>
          <p class="text-slate-500 text-sm mt-1">Masuk untuk mengelola portofolio dan blog</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div v-if="errorMessage" class="text-slate-700 text-xs bg-slate-100 p-3 rounded-lg border border-slate-200">
            {{ errorMessage }}
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@domain.com"
              class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/50"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/50"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </div>

      <!-- Form Verifikasi 2FA (TOTP) -->
      <div v-else>
        <div class="mb-6">
          <h1 class="text-xl font-medium text-slate-900 tracking-tight">Verifikasi 2FA</h1>
          <p class="text-slate-500 text-sm mt-1">Masukkan 6 digit kode dari aplikasi authenticator Anda</p>
        </div>

        <form @submit.prevent="handleVerifyMfa" class="space-y-4">
          <div v-if="errorMessage" class="text-slate-700 text-xs bg-slate-100 p-3 rounded-lg border border-slate-200">
            {{ errorMessage }}
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wider">Kode TOTP</label>
            <input
              id="mfaCode"
              v-model="mfaCode"
              type="text"
              placeholder="123456"
              maxlength="6"
              class="w-full px-3.5 py-2 text-sm text-center font-mono tracking-widest border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition bg-slate-50/50"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {{ loading ? 'Memproses...' : 'Verifikasi & Masuk' }}
          </button>

          <button
            type="button"
            @click="isMfaRequired = false; mfaCode = ''; errorMessage = null;"
            class="w-full text-slate-500 hover:text-slate-800 text-xs py-1.5 transition text-center"
          >
            Kembali ke Login
          </button>
        </form>
      </div>

    </div>
  </div>
</template>