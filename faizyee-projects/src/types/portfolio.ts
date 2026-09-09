export interface Profile {
  id?: number
  full_name: string
  title?: string
  bio: string
  avatar_url?: string
  updated_at?: string
}

export interface Contact {
  id?: number
  email: string
  phone?: string
  github_url?: string
  linkedin_url?: string
  updated_at?: string
}

export interface Project {
  id?: number
  title: string
  description: string
  tech_stack: string[]
  demo_url?: string
  repo_url?: string
  cover_image?: string
  created_at?: string
}

export interface Blog {
  id?: number
  title: string
  slug: string
  content: string
  is_published: boolean
  cover_image?: string
  created_at?: string
  excerpt?: string
}

export interface Ad {
  id?: number
  title: string
  image_url?: string | null
  target_url?: string | null
  position: string
  is_active: boolean
  created_at?: string
  description?: string
  button_text?: string
}