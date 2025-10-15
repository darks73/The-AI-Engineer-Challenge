"""
AI Provider abstraction layer for supporting multiple AI services.

This module provides a unified interface for interacting with different AI providers
(OpenAI, Claude, etc.) while maintaining consistent streaming response handling.
"""

import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional
from openai import OpenAI
from anthropic import Anthropic
from anthropic.types import MessageStreamEvent


class AIProvider(ABC):
    """Abstract base class for AI providers."""
    
    @abstractmethod
    async def stream_chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        max_tokens: int = 4000
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion responses from the AI provider.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model name to use for the completion
            max_tokens: Maximum tokens to generate
            
        Yields:
            str: Chunks of the response as they become available
        """
        pass
    
    @abstractmethod
    def get_supported_models(self) -> List[str]:
        """Get list of supported models for this provider."""
        pass
    
    @abstractmethod
    def validate_model(self, model: str) -> bool:
        """Validate if a model is supported by this provider."""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI provider implementation."""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    async def stream_chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        max_tokens: int = 4000
    ) -> AsyncGenerator[str, None]:
        """Stream OpenAI chat completion responses."""
        try:
            stream = self.client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                max_tokens=max_tokens
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def get_supported_models(self) -> List[str]:
        """Get supported OpenAI models."""
        return [
            "gpt-4o-mini",
            "gpt-4o", 
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo"
        ]
    
    def validate_model(self, model: str) -> bool:
        """Validate OpenAI model."""
        return model in self.get_supported_models()


class ClaudeProvider(AIProvider):
    """Claude (Anthropic) provider implementation."""
    
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
    
    async def stream_chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        max_tokens: int = 4000
    ) -> AsyncGenerator[str, None]:
        """Stream Claude chat completion responses."""
        try:
            # Extract system message if present
            system_message = ""
            if messages and messages[0].get("role") == "system":
                system_message = messages[0]["content"]
            
            # Convert OpenAI-style messages to Claude format (this already filters out system messages)
            claude_messages = self._convert_messages(messages)
            
            stream = self.client.messages.create(
                model=model,
                system=system_message,
                messages=claude_messages,
                max_tokens=max_tokens,
                stream=True
            )
            
            for event in stream:
                if hasattr(event, 'type') and event.type == 'content_block_delta':
                    if hasattr(event, 'delta') and hasattr(event.delta, 'text'):
                        yield event.delta.text
                        
        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")
    
    def _convert_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert OpenAI-style messages to Claude format."""
        claude_messages = []
        
        for message in messages:
            if message["role"] == "system":
                continue  # System messages are handled separately in Claude
            
            claude_message = {
                "role": message["role"] if message["role"] != "assistant" else "assistant",
                "content": self._convert_content(message["content"])
            }
            claude_messages.append(claude_message)
        
        return claude_messages
    
    def _convert_content(self, content: Any) -> str:
        """Convert OpenAI content format to Claude text format."""
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            # Handle multimodal content (text + images)
            text_parts = []
            for item in content:
                if item.get("type") == "text":
                    text_parts.append(item["text"])
                # Note: Claude image handling would need additional implementation
                # For now, we'll focus on text-only responses
            return " ".join(text_parts)
        else:
            return str(content)
    
    def get_supported_models(self) -> List[str]:
        """Get supported Claude models."""
        return [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307"
        ]
    
    def validate_model(self, model: str) -> bool:
        """Validate Claude model."""
        return model in self.get_supported_models()


class ProviderFactory:
    """Factory class for creating AI providers."""
    
    @staticmethod
    def create_provider(provider_type: str, api_key: str) -> AIProvider:
        """
        Create an AI provider instance.
        
        Args:
            provider_type: Type of provider ('openai' or 'claude')
            api_key: API key for the provider
            
        Returns:
            AIProvider: Instance of the requested provider
            
        Raises:
            ValueError: If provider type is not supported
        """
        provider_type = provider_type.lower()
        
        if provider_type == "openai":
            return OpenAIProvider(api_key)
        elif provider_type == "claude":
            return ClaudeProvider(api_key)
        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")
    
    @staticmethod
    def get_provider_api_key(provider_type: str, custom_key: Optional[str] = None) -> str:
        """
        Get API key for a provider from environment variables or custom key.
        
        Args:
            provider_type: Type of provider ('openai' or 'claude')
            custom_key: Custom API key provided by user
            
        Returns:
            str: API key
            
        Raises:
            ValueError: If no API key is available
        """
        if custom_key:
            return custom_key
        
        provider_type = provider_type.lower()
        
        if provider_type == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                raise ValueError(
                    "❌ OpenAI API Key Required: No API key was provided in the request and no OPENAI_API_KEY environment variable is set. "
                    "Please either: 1) Add your API key in the frontend settings, or 2) Set the OPENAI_API_KEY environment variable on the server. "
                    "Get your API key from: https://platform.openai.com/api-keys"
                )
            return api_key
        
        elif provider_type == "claude":
            api_key = os.environ.get("CLAUDE_API_KEY")
            if not api_key:
                raise ValueError(
                    "❌ Claude API Key Required: No API key was provided in the request and no CLAUDE_API_KEY environment variable is set. "
                    "Please either: 1) Add your API key in the frontend settings, or 2) Set the CLAUDE_API_KEY environment variable on the server. "
                    "Get your API key from: https://console.anthropic.com/"
                )
            return api_key
        
        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")


def get_all_supported_models() -> Dict[str, List[str]]:
    """Get all supported models grouped by provider."""
    return {
        "openai": OpenAIProvider("dummy_key").get_supported_models(),
        "claude": ClaudeProvider("dummy_key").get_supported_models()
    }
