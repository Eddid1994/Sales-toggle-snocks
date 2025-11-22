import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Google Ads Sale Toggle',
  description: 'Automated Sale Toggles for PMax & Demand Gen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

