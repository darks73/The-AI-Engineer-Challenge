'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Send } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleVoiceClick = () => {
    // Placeholder for voice input functionality
    alert('Voice input not implemented yet')
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 bg-dark-surface border border-dark-border rounded-xl p-3 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
          {/* Add button - placeholder for now */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-bg hover:bg-dark-border text-dark-text-secondary hover:text-dark-text transition-colors duration-200 text-sm font-medium"
          >
            Add
          </button>

          {/* Main input area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              disabled={disabled}
              className="w-full bg-transparent text-dark-text placeholder-dark-text-secondary resize-none focus:outline-none min-h-[24px] max-h-32"
              rows={1}
            />
          </div>

          {/* Voice button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-bg hover:bg-dark-border text-dark-text-secondary hover:text-dark-text transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic size={16} />
            <span className="text-sm font-medium">Voice</span>
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="chat-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
      
      {/* Welcome message when no messages */}
      <div className="text-center mt-8">
        <h2 className="text-2xl font-semibold text-dark-text mb-2">What can I help with?</h2>
      </div>
    </div>
  )
}
