'use client'

import { AuthProvider, useAuth } from '../contexts/AuthContext'
import ChatInterface from '@/components/ChatInterface'
import LoginScreen from '@/components/LoginScreen'

function AppContent() {
  const { isAuthenticated, isLoading, isLoggingOut, isLoggingIn } = useAuth()

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

  return isAuthenticated ? <ChatInterface /> : <LoginScreen />
}

export default function Home() {
  return (
    <AuthProvider>
      <main className="h-screen bg-dark-bg overflow-hidden">
        <AppContent />
      </main>
    </AuthProvider>
  )
}
