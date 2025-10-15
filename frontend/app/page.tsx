'use client'

import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import ChatInterface from '@/components/ChatInterface'
import LoginScreen from '@/components/LoginScreen'

function AppContent() {
  const { isAuthenticated, isLoading, isLoggingOut, isLoggingIn } = useAuth()
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    // Check if we're coming from a callback
    const referrer = typeof window !== 'undefined' ? document.referrer : ''
    const isFromCallback = referrer.includes('/auth/callback')
    
    if (isFromCallback) {
      // If coming from callback, wait longer for authentication to settle
      const timer = setTimeout(() => {
        setInitialLoad(false)
      }, 1500)
      
      return () => clearTimeout(timer)
    } else {
      // Normal loading, shorter delay
      const timer = setTimeout(() => {
        setInitialLoad(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [])

  if (isLoading || initialLoad) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="text-dark-text">Loading...</div>
      </div>
    )
  }

  if (isLoggingOut) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-dark-text text-lg">Logging you out...</div>
        <div className="text-dark-text-secondary text-sm mt-2">Please wait while we complete the logout process</div>
      </div>
    )
  }

  return isAuthenticated ? <ChatInterface /> : <LoginScreen />
}

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-dark-bg flex flex-col">
        <AppContent />
      </main>
    </AuthProvider>
  )
}
