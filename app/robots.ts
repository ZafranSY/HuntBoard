import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://job.zafran-sakowi.my'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/wishlist', '/resumes', '/analytics', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
