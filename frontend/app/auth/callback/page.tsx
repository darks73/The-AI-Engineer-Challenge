'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { oidcAuth } from '../../../lib/oidc'
import { LogIn, AlertCircle } from 'lucide-react'
import ChatInterface from '../../../components/ChatInterface'
import { AuthProvider, useAuth } from '../../../contexts/AuthContext'

function AuthenticatedChatInterface() {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Show loading until authentication is confirmed
  if (isLoading || !isAuthenticated) {
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
              Please wait while we complete your authentication.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return <ChatInterface />
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        console.log('Callback received:', { code: code ? 'present' : 'missing', state, error })

        if (error) {
          throw new Error(`Authentication error: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        // Check if we've already processed this callback (prevent replay)
        const processedKey = `callback_processed_${code}`
        if (sessionStorage.getItem(processedKey)) {
          console.log('Callback already processed, staying on callback page...')
          setStatus('success')
          return
        }

        // Mark this callback as processed
        sessionStorage.setItem(processedKey, 'true')

        console.log('Starting OIDC callback handling...')
        await oidcAuth.handleCallback(code, state || '')
        console.log('OIDC callback completed successfully')
        
        // Brief delay to ensure authentication state is settled
        console.log('🔍 Ensuring authentication state is settled...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Directly render the chat interface on the callback page
        setStatus('success')

      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-dark-bg">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-spin">
              <LogIn size={24} className="text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-dark-text">
                Completing sign in...
              </h2>
              <p className="text-dark-text-secondary">
                Please wait while we complete your authentication.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <AuthProvider>
            <AuthenticatedChatInterface />
          </AuthProvider>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-dark-text">
                Sign in failed
              </h2>
              <p className="text-red-400 text-sm">
                {error}
              </p>
              <button
                onClick={() => {
                  // Clear all session data and start fresh login
                  sessionStorage.clear();
                  localStorage.removeItem('oidc_token');
                  localStorage.removeItem('oidc_refresh_token');
                  localStorage.removeItem('oidc_user');
                  router.push('/');
                }}
                className="chat-button"
              >
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-dark-text">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
