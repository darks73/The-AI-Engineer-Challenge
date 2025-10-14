# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import base64
import io
import asyncio
from typing import Optional, List
from auth import oidc_auth

# Load environment variables from .env file (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not installed, continue without it
    pass

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

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
    token = credentials.credentials
    claims = await oidc_auth.validate_token(token)
    
    if not claims:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return claims

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Updated to support vision
    api_key: Optional[str] = None  # OpenAI API key for authentication (optional, can use default)
    images: Optional[List[str]] = None  # Base64 encoded images

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Use provided API key or fall back to environment variable
        api_key = request.api_key or os.environ.get("OPENAI_API_KEY")
        
        if not api_key:
            raise HTTPException(
                status_code=400, 
                detail="❌ OpenAI API Key Required: No API key was provided in the request and no OPENAI_API_KEY environment variable is set. Please either: 1) Add your API key in the frontend settings, or 2) Set the OPENAI_API_KEY environment variable on the server. Get your API key from: https://platform.openai.com/api-keys"
            )
        
        # Initialize OpenAI client with the API key
        client = OpenAI(api_key=api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Prepare messages array
            messages = [
                {"role": "system", "content": request.developer_message}
            ]
            
            # Prepare user message content
            user_content = [{"type": "text", "text": request.user_message}]
            
            # Add images if provided
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
            
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=messages,
                stream=True,  # Enable streaming response
                max_tokens=4000  # Increase token limit for vision
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define a root endpoint for testing
@app.get("/")
async def root():
    return {"message": "FastAPI backend is running!", "endpoints": ["/api/health", "/api/chat", "/api/debug"]}

# Debug endpoint to check environment variables
@app.get("/api/debug")
async def debug_env():
    """Debug endpoint to check environment variable status"""
    api_key_status = "SET" if os.environ.get("OPENAI_API_KEY") else "NOT SET"
    api_key_preview = os.environ.get("OPENAI_API_KEY", "")[:20] + "..." if os.environ.get("OPENAI_API_KEY") else "None"
    
    return {
        "OPENAI_API_KEY": {
            "status": api_key_status,
            "preview": api_key_preview,
            "length": len(os.environ.get("OPENAI_API_KEY", "")) if os.environ.get("OPENAI_API_KEY") else 0
        },
        "all_env_vars": {k: v for k, v in os.environ.items() if "OPENAI" in k or "API" in k}
    }

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
