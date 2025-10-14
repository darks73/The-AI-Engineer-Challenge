'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { oidcAuth, AuthState, UserInfo } from '../lib/oidc'

interface AuthContextType extends AuthState {
  login: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state
    setAuthState({
      isAuthenticated: oidcAuth.isAuthenticated(),
      user: oidcAuth.getUser(),
      token: oidcAuth.getToken(),
      refreshToken: null
    })
    setIsLoading(false)

    // Subscribe to auth state changes
    const unsubscribe = oidcAuth.subscribe((newState) => {
      setAuthState(newState)
    })

    return unsubscribe
  }, [])

  const login = async () => {
    await oidcAuth.login()
  }

  const logout = async () => {
    await oidcAuth.logout()
  }

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
