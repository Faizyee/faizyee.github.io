// composables/usePortfolio.ts
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { Profile, Contact, Project, Blog } from '../types/portfolio'

// State global agar data tetap konsisten antar komponen
const profile = ref<Profile | null>(null)
const contact = ref<Contact | null>(null)
const projects = ref<Project[]>([])
const blogs = ref<Blog[]>([])
const loading = ref<boolean>(false)

export function usePortfolio() {

  // ==========================================
  // --- FETCH ALL DATA (Untuk HomeView.vue) ---
  // ==========================================
  
  const fetchAllData = async () => {
    loading.value = true
    try {
      await Promise.all([
        getProfile(),
        getContact(),
        getProjects(),
        getBlogs(true) // Ambil hanya blog yang dipublikasi untuk tampilan publik
      ])
    } catch (error) {
      console.error('Error fetching all portfolio data:', error)
    } finally {
      loading.value = false
    }
  }

  // ==========================================
  // --- PROFIL & KONTAK ---
  // ==========================================
  
  const getProfile = async (): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error.message)
    } else {
      profile.value = data as Profile | null
    }
    return data as Profile | null
  }

  const saveProfile = async (profileData: Profile): Promise<Profile | null> => {
    loading.value = true
    
    const { id, ...rest } = profileData
    const payload = id
      ? { ...profileData, updated_at: new Date().toISOString() }
      : { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabase
      .from('profile')
      .upsert(payload)
      .select()
      .single()

    loading.value = false
    if (error) throw error
    
    profile.value = data as Profile
    return data as Profile | null
  }

  const getContact = async (): Promise<Contact | null> => {
    const { data, error } = await supabase
      .from('contact')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching contact:', error.message)
    } else {
      contact.value = data as Contact | null
    }
    return data as Contact | null
  }

  const saveContact = async (contactData: Contact): Promise<Contact | null> => {
    loading.value = true
    
    const { id, ...rest } = contactData
    const payload = id
      ? { ...contactData, updated_at: new Date().toISOString() }
      : { ...rest, updated_at: new Date().toISOString() }

    const { data, error } = await supabase
      .from('contact')
      .upsert(payload)
      .select()
      .single()

    loading.value = false
    if (error) throw error

    contact.value = data as Contact
    return data as Contact | null
  }

  // ==========================================
  // --- PROJECTS ---
  // ==========================================

  const getProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error.message)
    } else {
      projects.value = (data as Project[]) || []
    }
    return (data as Project[]) || []
  }

  const addProject = async (projectData: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> => {
    loading.value = true
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    loading.value = false
    if (error) throw error
    
    await getProjects()
    return data as Project | null
  }

  const updateProject = async (id: number, projectData: Partial<Project>): Promise<Project | null> => {
    loading.value = true
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single()

    loading.value = false
    if (error) throw error

    await getProjects()
    return data as Project | null
  }

  const deleteProject = async (id: number): Promise<void> => {
    loading.value = true
    const { error } = await supabase.from('projects').delete().eq('id', id)
    loading.value = false
    if (error) throw error

    await getProjects()
  }

  // ==========================================
  // --- BLOGS ---
  // ==========================================

  const getBlogs = async (onlyPublished: boolean = false): Promise<Blog[]> => {
    let query = supabase.from('blogs').select('*')
    
    if (onlyPublished) {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching blogs:', error.message)
    } else {
      blogs.value = (data as Blog[]) || []
    }
    return (data as Blog[]) || []
  }

  const addBlog = async (blogData: Omit<Blog, 'id' | 'created_at'>): Promise<Blog | null> => {
    loading.value = true
    const { data, error } = await supabase
      .from('blogs')
      .insert([blogData])
      .select()
      .single()

    loading.value = false
    if (error) throw error

    await getBlogs()
    return data as Blog | null
  }

  const updateBlog = async (id: number, blogData: Partial<Blog>): Promise<Blog | null> => {
    loading.value = true
    const { data, error } = await supabase
      .from('blogs')
      .update(blogData)
      .eq('id', id)
      .select()
      .single()

    loading.value = false
    if (error) throw error

    await getBlogs()
    return data as Blog | null
  }

  const deleteBlog = async (id: number): Promise<void> => {
    loading.value = true
    const { error } = await supabase.from('blogs').delete().eq('id', id)
    loading.value = false
    if (error) throw error

    await getBlogs()
  }

  // Clear all data (useful for logout)
  const clearData = () => {
    profile.value = null
    contact.value = null
    projects.value = []
    blogs.value = []
  }

  return {
    // State Reaktif
    profile,
    contact,
    projects,
    blogs,
    loading,
    
    // Batch Method
    fetchAllData,
    clearData,

    // Profile & Contact
    getProfile,
    saveProfile,
    getContact,
    saveContact,

    // Projects
    getProjects,
    addProject,
    updateProject,
    deleteProject,

    // Blogs
    getBlogs,
    addBlog,
    updateBlog,
    deleteBlog
  }
}