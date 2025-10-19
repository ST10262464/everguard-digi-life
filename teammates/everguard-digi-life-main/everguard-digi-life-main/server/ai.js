// ai.js
// EverGuard AI Guardian Assistant – Built for life continuity, security, and empathy.
// Note: Uses Google's Gemini API (free-tier friendly)

import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables are loaded by server.js

// Initialize Gemini AI (use environment variable or fallback key for testing)
let genAI;
let model;

// Initialize the AI components after environment variables are loaded
function initializeAI() {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');
  console.log('🔑 API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
  console.log('🔑 Key length:', process.env.GEMINI_API_KEY?.length || 0);

  // Configure the model
model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-lite",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});
}

// Initialize immediately if environment variables are already loaded
if (process.env.GEMINI_API_KEY) {
  initializeAI();
}

// System prompt defines AI’s persona and behavior
const SYSTEM_PROMPT = `
You are the AI Guardian Assistant within EverGuard — a secure, all-in-one life continuity platform built on BlockDAG.
Your role is to protect, guide, and empower users as they manage their data, emergencies, and legacy.

Your core areas:
1. Emergency & Health Protection Suite
2. Legal & Legacy Management
3. Personal Vault & Secure Sharing
4. AI Privacy & Safety Support
5. Community Protection (GBV, Shelters, Legal Aid)

Be calm, empathetic, and trustworthy. Keep messages short and clear.

Guidelines:
- Prioritize user safety and data privacy at all times.
- When emergencies or GBV cases are mentioned, provide immediate, actionable guidance and relevant hotlines.
- Avoid speculation — stick to facts or suggest checking verified sources.
- If legal or medical issues arise, clarify that you’re an AI assistant, not a professional advisor.
- Always maintain confidentiality tone and safety-first communication.

Emergency Contacts (South Africa):
• GBV Command Centre: 0800 428 428
• Police: 10111
• Medical Emergency: 112

Tone:
• Calm, supportive, protective, and professional.
• Never sensationalize — always reassure.
`;

/**
 * Chat with the AI Guardian Assistant
 * @param {string} message - The user's message
 * @returns {Promise<string>} - The AI's response
 */
async function chatWithAI(message) {
  console.log('🧠 [EverGuard AI] Processing message:', message);

  // Ensure AI is initialized
  if (!model) {
    initializeAI();
  }

  try {
    // Start chat session with EverGuard system context
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I am the EverGuard AI Guardian Assistant — ready to help you with data protection, emergency support, and digital legacy management. How can I assist you today?" }],
        },
      ],
    });

    // Send user input and receive AI response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('✅ [EverGuard AI] Response generated successfully');
    return aiResponse;

  } catch (error) {
    console.error('❌ [EverGuard AI] Processing failed:', error);

    // Handle common errors gracefully
    if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
      return "I’m currently unable to access the AI engine securely. Please check that the EverGuard AI service is properly configured.";
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return "I'm experiencing high traffic right now. Please try again in a few moments — your data and requests remain safe.";
    }

    return "I'm sorry, but I'm having trouble responding right now. Please try again shortly or contact support if it's urgent.";
  }
}

/**
 * Suggest next messages or questions to guide the user
 * @param {string} context - Current chat context
 * @returns {Promise<Array<string>>} - Suggested next responses
 */
async function generateResponseSuggestions(context) {
  try {
    // Ensure AI is initialized
    if (!model) {
      initializeAI();
    }

    const prompt = `
Based on the following conversation, suggest 3 short and relevant next steps or questions a user might ask.
Keep them aligned with EverGuard's purpose: data protection, emergencies, digital will, privacy, or community safety.

Conversation: "${context}"

Return only the suggestions, one per line, no numbering or formatting.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract clean suggestions
    const suggestions = text.split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\d+\./))
      .slice(0, 3);

    console.log('✅ [EverGuard AI] Suggestions generated');
    return suggestions.length > 0 ? suggestions : getDefaultSuggestions();

  } catch (error) {
    console.error('❌ [EverGuard AI] Suggestion generation failed:', error);
    return getDefaultSuggestions();
  }
}

/**
 * Default fallback suggestions if AI generation fails
 */
function getDefaultSuggestions() {
  return [
    "Show me how to set up an Emergency Capsule",
    "How do I secure my personal documents?",
    "What happens to my data after I’m gone?"
  ];
}

/**
 * Chat + Suggestions (combined output)
 * @param {string} message - User's message
 * @returns {Promise<Object>} - Object with AI response, suggestions, timestamp
 */
async function chatWithSuggestions(message) {
  try {
    const aiResponse = await chatWithAI(message);
    const suggestions = await generateResponseSuggestions(message);

    return {
      response: aiResponse,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [EverGuard AI] Combined chat failed:', error);
    return {
      response: "I’m currently offline but your message is safe. Please retry shortly.",
      suggestions: getDefaultSuggestions(),
      timestamp: new Date().toISOString()
    };
  }
}

export {
  chatWithAI,
  chatWithSuggestions,
  generateResponseSuggestions,
  getDefaultSuggestions
};
