'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Infinity, Zap } from 'lucide-react'

interface ModelSelectorProps {
  provider: 'openai' | 'claude'
  model: string
  onProviderChange: (provider: 'openai' | 'claude') => void
  onModelChange: (model: string) => void
  disabled?: boolean
}

interface ModelInfo {
  id: string
  name: string
  description: string
  provider: 'openai' | 'claude'
}

const MODELS: ModelInfo[] = [
  // OpenAI Models
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient with image support',
    provider: 'openai'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model with image support',
    provider: 'openai'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Advanced reasoning with image support',
    provider: 'openai'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable text-only model',
    provider: 'openai'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective',
    provider: 'openai'
  },
  
  // Claude Models
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    description: 'Latest Haiku - Fast, intelligent, and cost-effective',
    provider: 'claude'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Previous generation Haiku model',
    provider: 'claude'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fast and lightweight',
    provider: 'claude'
  }
]

export default function ModelSelector({ 
  provider, 
  model, 
  onProviderChange, 
  onModelChange, 
  disabled = false 
}: ModelSelectorProps) {
  const [showProviderDropdown, setShowProviderDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const providerDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  const currentProviderModels = MODELS.filter(m => m.provider === provider)
  const currentModel = MODELS.find(m => m.id === model) || currentProviderModels[0]

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setShowProviderDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (disabled) return
      
      // Ctrl+/ to toggle model selector
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault()
        setShowModelDropdown(!showModelDropdown)
      }
      
      // Ctrl+I for OpenAI
      if (event.ctrlKey && event.key === 'i') {
        event.preventDefault()
        onProviderChange('openai')
        setShowProviderDropdown(false)
      }
      
      // Ctrl+L for Claude (using L for "Language model")
      if (event.ctrlKey && event.key === 'l') {
        event.preventDefault()
        onProviderChange('claude')
        setShowProviderDropdown(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [disabled, onProviderChange])

  const handleProviderSelect = (newProvider: 'openai' | 'claude') => {
    onProviderChange(newProvider)
    setShowProviderDropdown(false)
    
    // Auto-select first model of new provider
    const firstModel = MODELS.find(m => m.provider === newProvider)
    if (firstModel) {
      onModelChange(firstModel.id)
    }
  }

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setShowModelDropdown(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Provider Selector */}
      <div className="relative" ref={providerDropdownRef}>
        <button
          onClick={() => !disabled && setShowProviderDropdown(!showProviderDropdown)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200
            ${provider === 'openai' 
              ? 'bg-dark-surface border-dark-border text-dark-text' 
              : 'bg-dark-surface border-dark-border text-dark-text hover:bg-dark-border'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={`Switch AI provider (Ctrl+I for OpenAI, Ctrl+L for Claude)`}
        >
          {provider === 'openai' ? (
            <Zap size={16} className="text-accent" />
          ) : (
            <Infinity size={16} className="text-blue-400" />
          )}
          <span className="text-sm font-medium capitalize">{provider}</span>
          <ChevronDown size={14} className="text-dark-text-secondary" />
        </button>

        {/* Provider Dropdown */}
        {showProviderDropdown && (
          <div className="absolute bottom-full left-0 mb-1 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => handleProviderSelect('openai')}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-dark-border transition-colors"
              >
                <Zap size={16} className="text-accent" />
                <div>
                  <div className="text-sm font-medium text-dark-text">OpenAI</div>
                  <div className="text-xs text-dark-text-secondary">GPT models</div>
                </div>
              </button>
              <button
                onClick={() => handleProviderSelect('claude')}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-dark-border transition-colors"
              >
                <Infinity size={16} className="text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Claude</div>
                  <div className="text-xs text-dark-text-secondary">Anthropic models</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Model Selector */}
      <div className="relative" ref={modelDropdownRef}>
        <button
          onClick={() => !disabled && setShowModelDropdown(!showModelDropdown)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200
            bg-dark-surface border-dark-border text-dark-text hover:bg-dark-border
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Switch AI model (Ctrl+/ to toggle)"
        >
          <span className="text-sm font-medium">{currentModel.name}</span>
          <ChevronDown size={14} className="text-dark-text-secondary" />
        </button>

        {/* Model Dropdown */}
        {showModelDropdown && (
          <div className="absolute bottom-full left-0 mb-1 w-64 bg-dark-surface border border-dark-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="py-1">
              {currentProviderModels.map((modelOption) => (
                <button
                  key={modelOption.id}
                  onClick={() => handleModelSelect(modelOption.id)}
                  className={`
                    w-full flex flex-col items-start px-4 py-3 text-left hover:bg-dark-border transition-colors
                    ${model === modelOption.id ? 'bg-dark-border' : ''}
                  `}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium text-dark-text">{modelOption.name}</span>
                    {model === modelOption.id && (
                      <div className="ml-auto w-2 h-2 bg-accent rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs text-dark-text-secondary mt-1">{modelOption.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="text-xs text-dark-text-secondary">
        <span className="hidden sm:inline">Ctrl+/ to switch model</span>
        <span className="sm:hidden">Model</span>
      </div>
    </div>
  )
}
