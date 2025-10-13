'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-bg flex flex-col">
      <ChatInterface />
    </main>
  )
}
