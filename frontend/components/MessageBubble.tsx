'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [displayContent, setDisplayContent] = useState('')

  // For streaming effect on assistant messages
  useEffect(() => {
    if (message.role === 'assistant' && message.content) {
      setDisplayContent('')
      let index = 0
      const interval = setInterval(() => {
        if (index < message.content.length) {
          setDisplayContent(prev => prev + message.content[index])
          index++
        } else {
          clearInterval(interval)
        }
      }, 10) // Adjust speed as needed

      return () => clearInterval(interval)
    } else {
      setDisplayContent(message.content)
    }
  }, [message.content, message.role])

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
            {message.role === 'user' ? 'U' : 'AI'}
          </div>

          {/* Message content */}
          <div className={`group relative ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
            <div className={`rounded-xl p-4 ${
              message.role === 'user'
                ? 'bg-accent text-white'
                : 'bg-dark-surface border border-dark-border text-dark-text'
            }`}>
              <div className="whitespace-pre-wrap break-words">
                {displayContent}
                {message.role === 'assistant' && displayContent.length < message.content.length && (
                  <span className="inline-block w-2 h-4 bg-dark-text ml-1 animate-pulse"></span>
                )}
              </div>
              
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
