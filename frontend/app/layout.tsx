import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../lib/context/AuthContext'
import { Toaster } from 'react-hot-toast'
import SharedLayout from './components/SharedLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MUN Platform',
  description: 'A comprehensive platform for Model United Nations delegates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`h-full ${inter.className}`}>
        <AuthProvider>
          <SharedLayout>
            {children}
          </SharedLayout>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
} 