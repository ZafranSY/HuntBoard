import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://job.zafran-sakowi.my'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'HuntBoard — Premium Job Application Tracker',
    template: '%s | HuntBoard',
  },
  description:
    'A state-of-the-art SWE Job Application Tracker. Manage your pipeline, track resume versions, and organize interview stages in a privacy-oriented dashboard.',
  keywords: [
    'Job application tracker',
    'Kanban job tracker',
    'Software engineer job search',
    'Resume version tracker',
    'Career dashboard',
    'Job application pipeline',
  ],
  authors: [{ name: 'Zafran Sakowi', url: 'https://zafran-sakowi.my' }],
  creator: 'Zafran Sakowi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'HuntBoard — Premium Job Application Tracker',
    description:
      'A state-of-the-art SWE Job Application Tracker. Manage your pipeline, track resume versions, and organize interview stages in a privacy-oriented dashboard.',
    siteName: 'HuntBoard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HuntBoard — Premium Job Application Tracker',
    description:
      'A state-of-the-art SWE Job Application Tracker. Manage your pipeline, track resume versions, and organize interview stages in a privacy-oriented dashboard.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-7HZ8HEW529"} />
      </body>
    </html>
  )
}
