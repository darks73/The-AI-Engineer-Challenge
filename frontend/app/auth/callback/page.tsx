'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { oidcAuth } from '../../../lib/oidc'
import { LogIn, AlertCircle } from 'lucide-react'

export default function AuthCallback() {
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

        console.log('Starting OIDC callback handling...')
        await oidcAuth.handleCallback(code, state || '')
        console.log('OIDC callback completed successfully')
        setStatus('success')

        // Redirect to main app after successful authentication
        setTimeout(() => {
          router.push('/')
        }, 1000)

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
          <>
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <LogIn size={24} className="text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-dark-text">
                Sign in successful!
              </h2>
              <p className="text-dark-text-secondary">
                Redirecting to the chat...
              </p>
            </div>
          </>
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
                onClick={() => router.push('/')}
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
