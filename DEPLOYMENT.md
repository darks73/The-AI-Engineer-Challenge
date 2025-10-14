# Deployment Guide

This guide covers deploying the AI Chat application to Vercel (frontend) and Railway (backend).

## Backend Deployment (Railway)

### Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))

### Steps

1. **Deploy to Railway:**
   ```bash
   # Go to railway.app and sign up with GitHub
   # Create New Project → "Deploy from GitHub repo"
   # Select your repository: The-AI-Engineer-Challenge
   ```

2. **Configure Root Directory:**
   - Set **Root Directory** to `api/`
   - This tells Railway to look in the `api/` folder for your Python app

3. **Add Environment Variables:**
   In Railway dashboard → your service → Variables tab:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Railway Auto-Detection:**
   Railway will automatically:
   - ✅ Detect Python from `requirements.txt`
   - ✅ Find FastAPI from `app.py`
   - ✅ Use Gunicorn from `Procfile`
   - ✅ Set PORT environment variable

5. **Get Railway URL:**
   After deployment, Railway provides a URL like:
   `https://your-project-name-production-xxxx.up.railway.app`

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Railway backend deployed and URL available

### Steps

1. **Deploy to Vercel:**
   ```bash
   # Go to vercel.com and sign up with GitHub
   # Create New Project → Import from GitHub
   # Select your repository: The-AI-Engineer-Challenge
   ```

2. **Configure Build Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

3. **Add Environment Variables:**
   In Vercel dashboard → your project → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api/chat
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your frontend

## Local Development vs Production

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Next.js proxies `/api/*` to `localhost:8000/api/*`

### Production
- Frontend: `https://your-vercel-app.vercel.app`
- Backend: `https://your-railway-app.up.railway.app`
- Frontend uses `NEXT_PUBLIC_API_URL` to connect to Railway backend

## Testing Deployment

### Backend Health Check
```bash
curl https://your-railway-url.up.railway.app/api/health
# Should return: {"status":"ok"}
```

### Frontend Integration
1. Visit your Vercel URL
2. Try logging in with OIDC
3. Send a test message
4. Verify it reaches the Railway backend

## Environment Variables Summary

### Railway (Backend)
- `OPENAI_API_KEY`: Your OpenAI API key

### Vercel (Frontend)
- `NEXT_PUBLIC_API_URL`: Full URL to your Railway backend + `/api/chat`

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Backend allows all origins (`allow_origins=["*"]`)
   - Should work automatically

2. **Authentication Issues:**
   - Verify OIDC configuration matches between frontend and backend
   - Check that JWT tokens are being sent correctly

3. **API Connection Issues:**
   - Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
   - Check Railway backend is running and accessible
   - Test backend endpoints directly

### Debug Endpoints

The backend includes debug endpoints:
- `https://your-railway-url.up.railway.app/api/debug` - Check environment variables
- `https://your-railway-url.up.railway.app/health` - Health check

## Security Notes

- OpenAI API key is stored securely on Railway (not in code)
- OIDC authentication is required for chat endpoints
- CORS is configured for production domains
