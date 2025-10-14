'use client'

import { useAuth } from '../contexts/AuthContext'
import { LogIn } from 'lucide-react'

export default function LoginScreen() {
  const { login, isLoading } = useAuth()

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Login failed:', error)
    }
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
            You'll be redirected to OneWelcome to sign in securely.
          </p>
        </div>
      </div>
    </div>
  )
}
