'use client'

import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: File[]
  status?: 'pending' | 'sent' | 'failed'
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  userInitials: string
  onRetryMessage: (message: Message) => void
}

export default function ChatMessages({ messages, isLoading, userInitials, onRetryMessage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    // Find the scrollable chat container (parent with chat-scroll class)
    const chatContainer = messagesEndRef.current?.closest('.chat-scroll')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    } else {
      // Fallback to scrollIntoView if container not found
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  return (
    <div className="p-4 space-y-4 min-h-full">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-2xl font-semibold text-dark-text mb-4">
            What can I help with?
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          userInitials={userInitials}
          onRetryMessage={onRetryMessage}
        />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-4 max-w-3xl">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-dark-text-secondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-dark-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-dark-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-dark-text-secondary text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
