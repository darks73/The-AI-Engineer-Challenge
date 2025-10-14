'use client'

import { useState, useEffect } from 'react'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import SettingsModal from './SettingsModal'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Settings, LogOut } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: File[]
  status?: 'pending' | 'sent' | 'failed'
}

interface ChatSettings {
  apiKey: string
  developerMessage: string
  model: string
  userInitials: string
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')
    .replace(/&#60;/g, '<')
    .replace(/&#62;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

// Helper function to compute initials from user info
function computeUserInitials(user: any): string {
  if (!user) return 'U'
  
  const givenName = user.given_name || ''
  const familyName = user.family_name || ''
  
  if (givenName && familyName) {
    return (givenName.charAt(0) + familyName.charAt(0)).toUpperCase()
  }
  
  if (givenName) {
    return givenName.charAt(0).toUpperCase()
  }
  
  if (familyName) {
    return familyName.charAt(0).toUpperCase()
  }
  
  // Fallback to first character of name if available
  const name = user.name || user.preferred_username || user.email || ''
  if (name) {
    return name.charAt(0).toUpperCase()
  }
  
  return 'U'
}

export default function ChatInterface() {
  const { user, token, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [settings, setSettings] = useState<ChatSettings>({
    apiKey: '',
    developerMessage: 'You are a helpful AI assistant.',
    model: 'gpt-4o-mini',
    userInitials: 'U'
  })
  const [hasCustomInitials, setHasCustomInitials] = useState(false)

  // Update initials when user becomes available, but only if not manually set
  useEffect(() => {
    if (user && !hasCustomInitials) {
      const computedInitials = computeUserInitials(user)
      setSettings(prev => ({
        ...prev,
        userInitials: computedInitials
      }))
    }
  }, [user, hasCustomInitials])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      status: 'pending'
    }

    setMessages(prev => [...prev, userMessage])
    setAttachments([]) // Clear attachments after sending

    setIsLoading(true)

    try {
      // Mark user message as sent
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' as const }
          : msg
      ))

      // Convert images to base64
      const imageBase64s: string[] = []
      if (userMessage.attachments) {
        for (const file of userMessage.attachments) {
          try {
            const base64 = await fileToBase64(file)
            imageBase64s.push(base64)
          } catch (error) {
            console.error('Error converting image to base64:', error)
          }
        }
      }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/chat'
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
        body: JSON.stringify({
          developer_message: settings.developerMessage,
          user_message: content.trim(),
          model: settings.model,
          api_key: settings.apiKey.trim() || null,
          images: imageBase64s.length > 0 ? imageBase64s : undefined
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        if (chunk) {
          buffer += chunk
          
          // Update the message content with the current buffer
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: buffer }
                : msg
            )
          )
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Mark user message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'failed' as const }
          : msg
      ))
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
  }

  const handleSettingsChange = (newSettings: ChatSettings) => {
    // Check if user initials were manually changed
    if (newSettings.userInitials !== settings.userInitials) {
      setHasCustomInitials(true)
    }
    setSettings(newSettings)
    setShowSettings(false)
  }

  const handleFileUpload = (files: File[]) => {
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const validFiles = files.filter(file => allowedTypes.includes(file.type))
    
    if (validFiles.length !== files.length) {
      alert('Please only upload image files (JPEG, PNG, GIF, WebP)')
      return
    }

    // Check file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = validFiles.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      alert('File size must be less than 10MB')
      return
    }

    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  const handleRetryMessage = async (message: Message) => {
    if (message.role !== 'user') return
    
    // Reset message status to pending
    setMessages(prev => prev.map(msg => 
      msg.id === message.id 
        ? { ...msg, status: 'pending' as const }
        : msg
    ))

    // Remove any error messages that might be related to this message
    setMessages(prev => prev.filter(msg => 
      !(msg.role === 'assistant' && msg.content.startsWith('Error:'))
    ))

    // Retry sending the message
    await handleSendMessage(message.content)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-dark-text">AI Chat</h1>
          {user && (
            <div className="text-sm text-dark-text-secondary">
              Welcome, {decodeHtmlEntities(user.login_user_name || user.name || user.preferred_username || user.email || 'User')}!
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNewChat}
            className="icon-button"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="icon-button"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={logout}
            className="icon-button-red"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
          userInitials={settings.userInitials}
          onRetryMessage={handleRetryMessage}
        />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-dark-border">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading}
          attachments={attachments}
          onFileUpload={handleFileUpload}
          onRemoveAttachment={removeAttachment}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
