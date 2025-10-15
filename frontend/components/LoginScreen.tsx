'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn } from 'lucide-react'

export default function LoginScreen() {
  const { login, isLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogin = async () => {
    try {
      setIsRedirecting(true)
      // Small delay to show the "Completing sign in..." state
      await new Promise(resolve => setTimeout(resolve, 500))
      await login()
    } catch (error) {
      console.error('Login failed:', error)
      setIsRedirecting(false)
    }
  }

  // Show "Completing sign in..." state
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-bg">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-spin">
            <LogIn size={24} className="text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-dark-text">
              Completing sign in...
            </h2>
            <p className="text-dark-text-secondary">
              Please wait while we redirect you to sign in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-dark-bg">
      <div className="text-center space-y-8 max-w-md mx-auto p-8">
        {/* Logo/Icon */}
        <div className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center">
          <LogIn size={32} className="text-white" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-dark-text">
            AI Chat
          </h1>
          <p className="text-dark-text-secondary">
            Sign in to start chatting with AI
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="chat-button w-full flex items-center justify-center gap-3 py-4 text-lg font-medium"
        >
          <LogIn size={20} />
          {isLoading ? 'Signing in...' : 'Login'}
        </button>

        {/* Info */}
        <div className="text-sm text-dark-text-secondary">
          <p>
            You&apos;ll be redirected to OneWelcome to sign in securely.
          </p>
        </div>
      </div>
    </div>
  )
}
