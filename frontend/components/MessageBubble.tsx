'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: File[]
}

interface MessageBubbleProps {
  message: Message
  userInitials: string
}

export default function MessageBubble({ message, userInitials }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [displayContent, setDisplayContent] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])

  // Set display content directly
  useEffect(() => {
    setDisplayContent(message.content)
  }, [message.content])

  // Create object URLs for attachments
  useEffect(() => {
    if (message.attachments && message.attachments.length > 0) {
      const urls = message.attachments.map(file => URL.createObjectURL(file))
      setImageUrls(urls)
      
      // Cleanup function to revoke object URLs
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url))
      }
    } else {
      setImageUrls([])
    }
  }, [message.attachments])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Handle system messages differently
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 max-w-3xl">
          <div className="text-red-400 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">System Message</span>
            </div>
            <div className="text-red-300 font-medium">
              {displayContent}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            message.role === 'user' 
              ? 'bg-accent text-white' 
              : 'bg-dark-surface border border-dark-border text-dark-text'
          }`}>
            {message.role === 'user' ? userInitials : 'AI'}
          </div>

          {/* Message content */}
          <div className={`group relative ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
            <div className={`rounded-xl p-4 ${
              message.role === 'user'
                ? 'bg-accent text-white'
                : 'bg-dark-surface border border-dark-border text-dark-text'
            }`}>
              {/* Display attachments */}
              {imageUrls.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="max-w-48 max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Display text content */}
              {displayContent && (
                <div className="whitespace-pre-wrap break-words">
                  {displayContent}
                </div>
              )}
              
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  message.role === 'user'
                    ? 'text-white/70 hover:text-white'
                    : 'text-dark-text-secondary hover:text-dark-text'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs text-dark-text-secondary mt-1 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
