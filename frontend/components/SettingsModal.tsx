'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

interface ChatSettings {
  apiKey: string
  developerMessage: string
  model: string
  userInitials: string
}

interface SettingsModalProps {
  settings: ChatSettings
  onSave: (settings: ChatSettings) => void
  onClose: () => void
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [formData, setFormData] = useState<ChatSettings>(settings)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: keyof ChatSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-semibold text-dark-text">Settings</h2>
          <button
            onClick={onClose}
            className="text-dark-text-secondary hover:text-dark-text transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-dark-text mb-2">
              OpenAI API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="chat-input w-full pr-10"
                placeholder="Enter your OpenAI API key"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary hover:text-dark-text"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-dark-text-secondary mt-1">
              Your API key is stored locally and never shared with our servers.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-dark-text mb-2">
              Model
            </label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="chat-input w-full"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Supports Images)</option>
              <option value="gpt-4o">GPT-4o (Supports Images)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Supports Images)</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          {/* User Initials */}
          <div>
            <label htmlFor="userInitials" className="block text-sm font-medium text-dark-text mb-2">
              Your Initials
            </label>
            <input
              type="text"
              id="userInitials"
              value={formData.userInitials}
              onChange={(e) => handleChange('userInitials', e.target.value.toUpperCase())}
              className="chat-input w-full"
              placeholder="Enter your initials (e.g., JD)"
              maxLength={3}
            />
            <p className="text-xs text-dark-text-secondary mt-1">
              These will appear in your message bubbles instead of "U".
            </p>
          </div>

          {/* Developer Message */}
          <div>
            <label htmlFor="developerMessage" className="block text-sm font-medium text-dark-text mb-2">
              System Message
            </label>
            <textarea
              id="developerMessage"
              value={formData.developerMessage}
              onChange={(e) => handleChange('developerMessage', e.target.value)}
              className="chat-input w-full h-24"
              placeholder="Define the AI's behavior and role..."
              rows={4}
            />
            <p className="text-xs text-dark-text-secondary mt-1">
              This message sets the context and behavior for the AI assistant.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="chat-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="chat-button flex items-center gap-2"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
