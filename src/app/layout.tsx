import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobTrack AI - Berlin',
  description: 'Job Application Tracker for Berlin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
