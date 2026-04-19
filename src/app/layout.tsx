import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Projex — Management, Reimagined',
  description: 'The all-in-one platform for service businesses. Projects, estimates, invoices, team management, client portal, and more. Start your free trial today.',
  keywords: 'project management software, business management platform, estimating software, invoice generator, team management, client portal, contractor software, service business tools',
  openGraph: {
    title: 'Projex — Management, Reimagined',
    description: 'One platform for projects, estimates, invoices, and teams. Built for businesses that move fast.',
    url: 'https://projex.live',
    siteName: 'Projex',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projex — Management, Reimagined',
    description: 'One platform for projects, estimates, invoices, and teams.',
  },
  robots: 'index, follow',
  alternates: { canonical: 'https://projex.live' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Projex" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}` }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}