'use client'

import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import ChatInterface from '@/components/ChatInterface'
import LoginScreen from '@/components/LoginScreen'

function AppContent() {
  const { isAuthenticated, isLoading, isLoggingOut, isLoggingIn } = useAuth()
  
  // Check if we're transitioning from a callback
  const [isTransitioningFromCallback, setIsTransitioningFromCallback] = useState(false)
  
  useEffect(() => {
    // Check if we're coming from a callback
    if (typeof window !== 'undefined' && sessionStorage.getItem('oidc_callback_completed')) {
      console.log('🔍 Detected callback completion, showing login loading...')
      setIsTransitioningFromCallback(true)
      // Clear the flag
      sessionStorage.removeItem('oidc_callback_completed')
      
      // Clear the transition state when we're actually authenticated
      const checkAuthState = () => {
        if (isAuthenticated) {
          console.log('🔍 Authentication confirmed, hiding login loading...')
          setIsTransitioningFromCallback(false)
        } else {
          // Keep checking until authenticated or timeout
          setTimeout(checkAuthState, 100)
        }
      }
      
      // Start checking auth state
      checkAuthState()
      
      // Fallback timeout after 3 seconds
      setTimeout(() => {
        console.log('🔍 Fallback timeout, hiding login loading...')
        setIsTransitioningFromCallback(false)
      }, 3000)
    }
  }, [isAuthenticated])

  if (isLoading) {
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

  if (isLoggingIn || isTransitioningFromCallback) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
        <div className="text-dark-text text-lg">Logging you in...</div>
        <div className="text-dark-text-secondary text-sm mt-2">Please wait while we complete the authentication process</div>
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
