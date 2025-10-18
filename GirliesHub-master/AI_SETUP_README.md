# 🤖 Gemini AI Integration Setup Guide

This guide will help you set up the Gemini AI chatbot for your GirliesHub application.

## 🚀 Quick Start

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

1. Navigate to the `server` directory
2. Edit the `.env` file:
   ```bash
   # AI Configuration
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Test the AI Integration

```bash
node test-ai.js
```

### 5. Start the Server

```bash
npm start
# or for development
npm run dev
```

## 🔧 Configuration Details

### AI Model Settings

The AI is configured with the following settings in `server/ai.js`:

- **Model**: `gemini-1.5-flash` (fast and efficient)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 1024 (reasonable response length)
- **Top-K**: 40 (diverse vocabulary)
- **Top-P**: 0.95 (focused responses)

### System Prompt

The AI is trained with a comprehensive system prompt that includes:

- Platform overview (Financial Empowerment, GBV Support, Sanitary Aid)
- Safety guidelines and emergency contacts
- Response style guidelines
- South Africa-specific context

## 📱 Frontend Integration

The frontend has been updated with:

- **Enhanced Chat Interface**: Shows AI suggestions and conversation history
- **Error Handling**: Graceful fallbacks when AI is unavailable
- **Contextual Responses**: Maintains conversation context
- **Quick Questions**: Pre-defined common queries
- **Response Suggestions**: AI-generated follow-up questions

## 🧪 Testing

### Manual Testing

1. Start the server
2. Open the AI Assistant page in your browser
3. Try different types of questions:
   - Financial: "How do I find investment seminars?"
   - GBV Support: "I need safe shelter information"
   - Sanitary Aid: "Where are donation bins located?"

### Automated Testing

Run the test script to verify all AI functions:

```bash
node test-ai.js
```

## 🚨 Troubleshooting

### Common Issues

1. **"API_KEY not found" error**
   - Check your `.env` file
   - Ensure the API key is correct
   - Restart the server after changes

2. **"Authentication failed" error**
   - Verify your API key is valid
   - Check if you have billing enabled on Google AI Studio

3. **Slow responses**
   - The Gemini API may have rate limits
   - Check your Google AI Studio dashboard for usage

4. **Frontend not connecting**
   - Ensure the server is running on port 5000
   - Check browser console for CORS errors

### Fallback Behavior

If the AI service fails, the system will:

- Show appropriate error messages
- Provide fallback responses
- Maintain basic functionality
- Log errors for debugging

## 🔒 Security Considerations

- **API Key Protection**: Never commit your `.env` file to version control
- **Rate Limiting**: Consider implementing rate limiting for production
- **Input Validation**: All user inputs are sanitized before sending to AI
- **Error Handling**: Sensitive information is not exposed in error messages

## 📚 API Endpoints

### Basic Chat
```
POST /api/ai/chat
Body: { "message": "user message" }
```

### Contextual Chat
```
POST /api/ai/chat/context
Body: { 
  "message": "user message", 
  "conversationHistory": ["previous messages"] 
}
```

## 🎯 Next Steps

1. **Customize Responses**: Modify the system prompt in `ai.js`
2. **Add Analytics**: Track AI usage and user satisfaction
3. **Implement Caching**: Cache common responses for better performance
4. **Add Multilingual Support**: Configure Gemini for multiple languages
5. **Integration Testing**: Test with real user scenarios

## 📞 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your API key and billing status
3. Test with the provided test script
4. Check Google AI Studio documentation

---

**Happy coding! 🚀**
