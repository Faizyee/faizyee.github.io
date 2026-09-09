// composables/useAds.ts
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

export interface Ad {
  id: number
  title: string
  image_url: string | null
  target_url: string | null
  position: string
  is_active: boolean
  created_at: string
  description?: string
  button_text?: string
}


export const useAds = () => {
  const client = supabase
    
  // State global menggunakan ref untuk data lokal komposable
  const ads = ref<Ad[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Mengambil daftar iklan yang aktif dari Supabase
   * @param position Opsional: Filter berdasarkan posisi iklan (misal: 'sidebar', 'header')
   */
  const fetchActiveAds = async (position?: string) => {
    loading.value = true
    error.value = null

    try {
      let query = client
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (position) {
        query = query.eq('position', position)
      }

      const { data, error: err } = await query

      if (err) throw err
      ads.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Gagal mengambil data iklan:', err.message)
    } finally {
      loading.value = false
    }
  }

  return {
    ads,
    loading,
    error,
    fetchActiveAds,
  }
}