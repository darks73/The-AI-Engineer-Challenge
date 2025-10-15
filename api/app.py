# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
import os
import base64
import io
import asyncio
from typing import Optional, List
from auth import oidc_auth
from providers import ProviderFactory, get_all_supported_models

# Load environment variables from .env file (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not installed, continue without it
    pass

# Initialize FastAPI application with a title
app = FastAPI(title="AI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# OIDC Authentication
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to validate JWT token and return user claims"""
    print(f"\n🔐 DEBUG: Authentication called")
    print(f"🔐 DEBUG: Credentials: {credentials}")
    
    if not credentials:
        print(f"🔐 DEBUG: No credentials provided")
        raise HTTPException(
            status_code=401,
            detail="No credentials provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    print(f"🔐 DEBUG: Token (first 50 chars): {token[:50] if token else 'None'}...")
    
    try:
        claims = await oidc_auth.validate_token(token)
        print(f"🔐 DEBUG: Token validation result: {claims}")
        
        if not claims:
            print(f"🔐 DEBUG: Token validation failed - no claims returned")
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"🔐 DEBUG: Authentication successful for user: {claims.get('sub', 'Unknown')}")
        return claims
        
    except Exception as e:
        print(f"🔐 DEBUG: Token validation error: {e}")
        raise HTTPException(
            status_code=401,
            detail=f"Token validation error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Model to use for completion
    provider: Optional[str] = "openai"  # AI provider: "openai" or "claude"
    api_key: Optional[str] = None  # API key for authentication (optional, can use default)
    images: Optional[List[str]] = None  # Base64 encoded images

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    print(f"\n🔍 DEBUG: Chat endpoint called")
    print(f"🔍 DEBUG: Request data: {request}")
    print(f"🔍 DEBUG: Current user: {current_user}")
    
    try:
        # Get API key for the specified provider
        api_key = ProviderFactory.get_provider_api_key(request.provider, request.api_key)
        
        # Create the appropriate provider instance
        provider = ProviderFactory.create_provider(request.provider, api_key)
        
        # Validate the model for the provider
        if not provider.validate_model(request.model):
            supported_models = provider.get_supported_models()
            raise HTTPException(
                status_code=400,
                detail=f"❌ Invalid model '{request.model}' for provider '{request.provider}'. "
                       f"Supported models: {', '.join(supported_models)}"
            )
        
        # Create an async generator function for streaming responses
        async def generate():
            # Prepare messages array
            messages = [
                {"role": "system", "content": request.developer_message}
            ]
            
            # Prepare user message content
            user_content = [{"type": "text", "text": request.user_message}]
            
            # Add images if provided (OpenAI format)
            if request.images:
                for image_base64 in request.images:
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    })
            
            messages.append({
                "role": "user",
                "content": user_content
            })
            
            # Stream the response using the provider
            async for chunk in provider.stream_chat_completion(
                messages=messages,
                model=request.model,
                max_tokens=4000
            ):
                yield chunk

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except ValueError as e:
        # Handle API key or model validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle any other errors that occur during processing
        print(f"❌ Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Define a root endpoint for testing
@app.get("/")
async def root():
    return {"message": "AI Chat API is running!", "endpoints": ["/api/health", "/api/chat", "/api/models", "/api/debug"]}

# Debug endpoint to check environment variables
@app.get("/api/debug")
async def debug_env():
    """Debug endpoint to check environment variable status"""
    openai_key_status = "SET" if os.environ.get("OPENAI_API_KEY") else "NOT SET"
    openai_key_preview = os.environ.get("OPENAI_API_KEY", "")[:20] + "..." if os.environ.get("OPENAI_API_KEY") else "None"
    
    claude_key_status = "SET" if os.environ.get("CLAUDE_API_KEY") else "NOT SET"
    claude_key_preview = os.environ.get("CLAUDE_API_KEY", "")[:20] + "..." if os.environ.get("CLAUDE_API_KEY") else "None"
    
    return {
        "OPENAI_API_KEY": {
            "status": openai_key_status,
            "preview": openai_key_preview,
            "length": len(os.environ.get("OPENAI_API_KEY", "")) if os.environ.get("OPENAI_API_KEY") else 0
        },
        "CLAUDE_API_KEY": {
            "status": claude_key_status,
            "preview": claude_key_preview,
            "length": len(os.environ.get("CLAUDE_API_KEY", "")) if os.environ.get("CLAUDE_API_KEY") else 0
        },
        "all_env_vars": {k: v for k, v in os.environ.items() if "OPENAI" in k or "CLAUDE" in k or "API" in k}
    }

# Get available models endpoint
@app.get("/api/models")
async def get_models():
    """Get all available models grouped by provider"""
    return get_all_supported_models()

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Railway often expects a /health endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "fastapi"}

# Get current user info
@app.get("/api/user")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information from JWT token"""
    return {
        "sub": current_user.get("sub"),
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "preferred_username": current_user.get("preferred_username"),
        "login_user_name": current_user.get("login_user_name"),
        "given_name": current_user.get("given_name"),
        "family_name": current_user.get("family_name")
    }


# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    import os
    # Get port from environment variable (for cloud platforms) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port: {port}")
    print(f"PORT environment variable: {os.environ.get('PORT', 'NOT SET')}")
    # Start the server on all network interfaces (0.0.0.0) on the specified port
    uvicorn.run(app, host="0.0.0.0", port=port)

# For Railway deployment with Gunicorn
# The app is automatically available when imported
