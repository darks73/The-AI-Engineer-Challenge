'use client'

import { useState } from 'react'
import ChatInput from './ChatInput'
import ChatMessages from './ChatMessages'
import SettingsModal from './SettingsModal'
import { Plus, Settings } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSettings {
  apiKey: string
  developerMessage: string
  model: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<ChatSettings>({
    apiKey: '',
    developerMessage: 'You are a helpful AI assistant.',
    model: 'gpt-4.1-mini'
  })

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !settings.apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: settings.developerMessage,
          user_message: content.trim(),
          model: settings.model,
          api_key: settings.apiKey
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

        buffer += new TextDecoder().decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: msg.content + line }
                  : msg
              )
            )
          }
        }
      }

      // Add any remaining buffer content
      if (buffer.trim()) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: msg.content + buffer }
              : msg
          )
        )
      }

    } catch (error) {
      console.error('Error sending message:', error)
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
    setSettings(newSettings)
    setShowSettings(false)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <h1 className="text-xl font-semibold text-dark-text">AI Chat</h1>
        <div className="flex gap-2">
          <button
            onClick={handleNewChat}
            className="chat-button-secondary flex items-center gap-2"
          >
            <Plus size={16} />
            New Chat
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="chat-button-secondary flex items-center gap-2"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages messages={messages} isLoading={isLoading} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-dark-border">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
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
