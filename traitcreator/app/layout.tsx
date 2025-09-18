import React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '../components/ui/Header'

export const metadata: Metadata = {
  title: 'TraitCreator - Custom T-Shirt Designer',
  description: 'Create and mint custom T-shirt designs as NFTs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Header />
        <div className="scan-line pt-20">
          {children}
        </div>
      </body>
    </html>
  )
} 