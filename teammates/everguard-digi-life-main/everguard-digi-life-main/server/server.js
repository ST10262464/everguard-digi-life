import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { chatWithSuggestions } from './ai.js';
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 Environment variables:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
console.log('🔍 Raw GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// AI Chat API endpoint
app.post('/api/ai/chat/enhanced', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        response: "I need a message to help you. Please try again.",
        suggestions: ["How do I set up my Emergency Capsule?", "Where can I store my digital will securely?"]
      });
    }

    console.log('🤖 AI Request:', message);
    
    // Call the AI function
    const result = await chatWithSuggestions(message);
    
    console.log('✅ AI Response generated');
    
    res.json({
      response: result.response,
      suggestions: result.suggestions,
      timestamp: result.timestamp
    });
    
  } catch (error) {
    console.error('❌ AI API Error:', error);
    
    res.status(500).json({
      response: "I'm currently experiencing technical difficulties. Please try again in a moment.",
      suggestions: [
        "Try again",
        "Contact support if urgent",
        "Check your internet connection"
      ],
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'EverGuard AI Guardian',
    timestamp: new Date().toISOString()
  });
});

// Fallback for React Router (serve index.html for all non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 EverGuard AI Server running on port ${PORT}`);
  console.log(`📡 AI API available at http://localhost:${PORT}/api/ai/chat/enhanced`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
});
