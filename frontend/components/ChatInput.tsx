'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Send, Paperclip, X, Image } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  attachments: File[]
  onFileUpload: (files: File[]) => void
  onRemoveAttachment: (index: number) => void
}

export default function ChatInput({ onSendMessage, disabled = false, attachments, onFileUpload, onRemoveAttachment }: ChatInputProps) {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files)
    }
    // Reset the input value so the same file can be selected again
    e.target.value = ''
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
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="relative bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image size={16} className="text-dark-text-secondary" />
              <span className="text-dark-text text-sm truncate max-w-32">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(index)}
                className="text-dark-text-secondary hover:text-red-400 transition-colors duration-200"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 bg-dark-surface border border-dark-border rounded-xl p-3 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
          {/* Add button with file upload */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={disabled}
            />
            <button
              type="button"
              className="p-2 rounded-lg text-dark-text-secondary hover:text-dark-text hover:bg-dark-border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
              title="Add attachment"
            >
              <Paperclip size={20} />
            </button>
          </div>

          {/* Main input area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              disabled={disabled}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              className="w-full bg-transparent text-dark-text placeholder-dark-text-secondary resize-none focus:outline-none min-h-[24px] max-h-32"
              rows={1}
            />
          </div>

          {/* Voice button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={disabled}
            className="p-2 rounded-lg text-dark-text-secondary hover:text-dark-text hover:bg-dark-border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voice input"
          >
            <Mic size={20} />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="chat-button disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
