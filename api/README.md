# AI Chat API

A FastAPI backend for the AI Chat application, providing OpenAI integration with streaming responses and image support.

## Features

- 🚀 **FastAPI** with async support
- 🤖 **OpenAI Integration** with multiple models
- 📸 **Image Upload Support** (Vision API)
- 🌊 **Streaming Responses** for real-time chat
- 🔒 **CORS Enabled** for frontend integration
- ☁️ **Railway Ready** deployment configuration

## API Endpoints

### Health Check
- **GET** `/health` - Railway-style health check
- **GET** `/api/health` - API health check
- **GET** `/` - Root endpoint with available endpoints

### Chat
- **POST** `/api/chat` - Main chat endpoint with streaming responses

## Local Development

### Prerequisites
- Python 3.8+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd The-AI-Engineer-Challenge/api
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Test the API**
   ```bash
   curl http://localhost:8000/health
   ```

## Railway Deployment

Railway is a cloud platform that makes it easy to deploy Python applications. Follow these steps to deploy your FastAPI app:

### Step 1: Prepare Your Repository

Ensure your project structure looks like this:
```
api/
├── app.py              # FastAPI application
├── requirements.txt    # Python dependencies
├── Procfile           # Railway startup command
└── README.md          # This file
```

### Step 2: Create Railway Account

1. **Go to [railway.app](https://railway.app)**
2. **Sign up** with GitHub
3. **Connect your GitHub account**

### Step 3: Deploy to Railway

1. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `The-AI-Engineer-Challenge`

2. **Configure Root Directory**
   - **IMPORTANT:** Set **Root Directory** to `api/`
   - This tells Railway to look in the `api/` folder for your Python app

3. **Railway Auto-Detection**
   Railway will automatically:
   - ✅ Detect Python from `requirements.txt`
   - ✅ Find FastAPI from `app.py`
   - ✅ Use Gunicorn from `Procfile`
   - ✅ Set PORT environment variable

### Step 4: Environment Variables

Add these environment variables in Railway dashboard:

1. **Go to your service settings**
2. **Navigate to Variables tab**
3. **Add the following:**

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 5: Test Deployment

Once deployed, Railway will provide a URL like:
`https://your-project-name-production-xxxx.up.railway.app`

Test these endpoints:
- `https://your-url/health` → Should return `{"status": "ok", "service": "fastapi"}`
- `https://your-url/api/health` → Should return `{"status": "ok"}`
- `https://your-url/` → Should show available endpoints

## Configuration Files

### `requirements.txt`
```
fastapi>=0.100.0,<0.105.0
uvicorn>=0.20.0,<0.25.0
gunicorn>=21.0.0
openai>=1.0.0,<2.0.0
pydantic>=2.0.0,<3.0.0
python-multipart>=0.0.5
```

### `Procfile`
```
web: gunicorn app:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway Error**
   - ✅ Ensure Root Directory is set to `api/`
   - ✅ Check that `Procfile` exists and is correct
   - ✅ Verify `requirements.txt` has all dependencies

2. **Port Issues**
   - Railway automatically sets `PORT` environment variable
   - Your app should use `os.environ.get("PORT", 8000)`

3. **Dependencies Not Installing**
   - Check `requirements.txt` for version conflicts
   - Railway uses flexible version ranges to avoid conflicts

### Railway Logs

Check deployment logs in Railway dashboard:
1. **Go to your service**
2. **Click "Deploy Logs"** tab
3. **Look for startup messages**

Expected logs:
```
Starting Container
gunicorn 23.0.0 starting
[INFO] Started server process [1]
[INFO] Application startup complete.
```

## API Usage

### Chat Request Format

```json
{
  "developer_message": "You are a helpful AI assistant.",
  "user_message": "Hello, how are you?",
  "model": "gpt-4o-mini",
  "api_key": "sk-your-openai-key",
  "images": ["base64_encoded_image_1", "base64_encoded_image_2"]
}
```

### Supported Models

- `gpt-4o-mini` (Supports images)
- `gpt-4o` (Supports images)
- `gpt-4-turbo` (Supports images)
- `gpt-4` (Text only)
- `gpt-3.5-turbo` (Text only)

## Frontend Integration

The frontend should connect to your Railway backend by setting:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api/chat
```

## Support

If you encounter issues:
1. Check Railway logs for errors
2. Verify environment variables are set
3. Test endpoints manually with curl
4. Ensure Root Directory is correctly set to `api/`

## License

This project is part of The AI Engineer Challenge.