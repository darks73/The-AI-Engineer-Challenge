# AI Engineer Challenge - Frontend

A modern, ChatGPT-like interface for the AI Engineer Challenge API built with Next.js and TypeScript.

## Features

- 🎨 **Modern UI**: Clean, dark-themed interface inspired by ChatGPT
- 💬 **Real-time Chat**: Streaming responses from the AI
- ⚙️ **Configurable Settings**: Customizable API keys, models, and system messages
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure**: API keys stored locally, never sent to our servers
- ⚡ **Fast**: Built with Next.js for optimal performance

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

## Local Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Backend API

In a separate terminal, start the FastAPI backend:

```bash
cd ../api
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 4. Configure Settings

1. Click the "Settings" button in the top-right corner
2. Enter your OpenAI API key
3. Optionally customize the system message and model
4. Save your settings

## Deployment on Vercel

### Automatic Deployment

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Vercel will automatically detect the Next.js configuration and deploy

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the frontend directory
cd frontend
vercel

# Follow the prompts to configure your deployment
```

### Environment Variables

For production deployment, you don't need to set any environment variables as the API key is managed through the UI settings.

## Project Structure

```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat interface
│   ├── ChatInput.tsx      # Message input component
│   ├── ChatMessages.tsx   # Messages display
│   ├── MessageBubble.tsx  # Individual message component
│   └── SettingsModal.tsx  # Settings configuration modal
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## API Integration

The frontend communicates with the backend API through these endpoints:

- `POST /api/chat` - Send messages and receive streaming responses
- `GET /api/health` - Health check endpoint

The API expects the following request format:

```json
{
  "developer_message": "System prompt",
  "user_message": "User's message",
  "model": "gpt-4.1-mini",
  "api_key": "your-openai-api-key"
}
```

## Customization

### Styling

The application uses Tailwind CSS with a custom dark theme. You can modify colors and styling in:

- `tailwind.config.js` - Theme configuration
- `app/globals.css` - Global styles and component classes

### Components

All components are built with TypeScript and can be easily customized:

- Add new features to `ChatInterface.tsx`
- Modify message appearance in `MessageBubble.tsx`
- Customize input behavior in `ChatInput.tsx`

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure the backend is running on port 8000
   - Check that CORS is properly configured in the backend

2. **Streaming Not Working**
   - Verify your OpenAI API key is valid
   - Check browser console for error messages

3. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript errors with `npm run lint`

### Development Tips

- Use browser dev tools to inspect API requests
- Check the Network tab to monitor streaming responses
- Use React DevTools for component debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is part of the AI Engineer Challenge.