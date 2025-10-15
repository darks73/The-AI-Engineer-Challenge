'use client'

import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import ChatInterface from '@/components/ChatInterface'
import LoginScreen from '@/components/LoginScreen'

function AppContent() {
  const { isAuthenticated, isLoading, isLoggingOut, isLoggingIn } = useAuth()
  const [isFromCallback, setIsFromCallback] = useState(false)

  useEffect(() => {
    // Check if we're coming from a callback
    const referrer = typeof window !== 'undefined' ? document.referrer : ''
    if (referrer.includes('/auth/callback')) {
      setIsFromCallback(true)
      // Clear after a moment
      setTimeout(() => setIsFromCallback(false), 1000)
    }
  }, [])

  if (isLoading || isFromCallback) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-bg">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-spin">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-dark-text">
              Completing sign in...
            </h2>
            <p className="text-dark-text-secondary">
              Please wait while we complete your authentication.
            </p>
          </div>
        </div>
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
