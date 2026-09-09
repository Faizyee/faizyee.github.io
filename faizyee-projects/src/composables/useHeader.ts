// composables/useHeader.ts
import { useSeoMeta, useHead } from '@unhead/vue'

export interface SeoHeaderOptions {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
  schema?: Record<string, any>
}

export const useHeader = (options: SeoHeaderOptions) => {
  const siteUrl = 'https://horatyee.com'
  const currentUrl = options.url || siteUrl
  const pageImage = options.image || `${siteUrl}/default-og.png`
  const pageType = options.type || 'website'

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogType: pageType,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: pageImage,
    ogUrl: currentUrl,
    ...(pageType === 'article' && options.publishedTime ? { articlePublishedTime: options.publishedTime } : {}),
    ...(pageType === 'article' && options.author ? { articleAuthor: [options.author] } : {}),
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: pageImage,
  })

  const headConfig: any = {
    link: [{ rel: 'canonical', href: currentUrl }]
  }

  if (options.schema) {
    headConfig.script = [
      {
        // Menggunakan 'as any' untuk melewati pembatasan tipe bawaan Unhead
        type: 'application/ld+json' as any,
        children: JSON.stringify(options.schema)
      }
    ]
  }

  useHead(headConfig)
}