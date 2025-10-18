const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI - using the valid API key directly
const genAI = new GoogleGenerativeAI('AIzaSyCca7_4PZMY9uBa5BLvNLWaGR_kiQFMoCA');

// Configure the model
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

// Simple system prompt for basic chatbot
const SYSTEM_PROMPT = `You are an AI assistant for GirliesHub, a comprehensive support platform for women in South Africa. Your role is to provide helpful, empathetic, and accurate information about our services.

Our platform offers three main areas of support:

1. **Financial Empowerment**: Investment seminars, financial literacy workshops, and personalized financial advice
2. **GBV Support**: Safe shelter locations, emergency contacts, counseling services, and legal aid
3. **Sanitary Aid**: Access to free sanitary products through donation bins across South Africa

Key guidelines:
- Always prioritize user safety, especially for GBV-related queries
- Provide specific, actionable information when possible
- Be empathetic and supportive in your responses
- Direct users to appropriate sections of our platform
- For urgent safety concerns, always provide emergency contact numbers
- Keep responses concise but informative
- If you're unsure about specific details, suggest they check our platform or contact support

Emergency contacts to mention when relevant:
- GBV Command Centre: 0800 428 428
- Police: 10111
- Emergency: 112

Remember: You're here to empower and support women in South Africa.`;

/**
 * Basic chat with AI assistant using Gemini API
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response
 */
async function chatWithAI(message) {
  console.log('🤖 [Gemini AI] Processing user message:', message);
  
  try {
    // Create chat session
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand my role as a GirliesHub AI assistant. I'm ready to help women in South Africa with financial empowerment, GBV support, and sanitary aid. How can I assist you today?" }],
        },
      ],
    });

    // Send user message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const aiResponse = response.text();
    
    console.log('✅ [Gemini AI] Generated response successfully');
    return aiResponse;
    
  } catch (error) {
    console.error('❌ [Gemini AI] AI processing failed:', error);
    
    // Fallback to contextual responses if Gemini API fails
    if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
      return "I apologize, but I'm experiencing authentication issues with my AI service. Please check with our support team to ensure the AI assistant is properly configured.";
    }
    
    if (error.message.includes('quota') || error.message.includes('rate') || error.message.includes('limit')) {
      return "I'm experiencing high demand right now. Please try again in a few minutes, or contact our support team if you need immediate assistance.";
    }
    
    return "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or contact our support team if you need immediate assistance.";
  }
}

/**
 * Generate response suggestions
 * @param {string} context - Conversation context
 * @returns {Promise<Array<string>>} - Suggested responses
 */
async function generateResponseSuggestions(context) {
  try {
    const prompt = `Based on this conversation context, suggest 3 helpful follow-up questions or responses that would be useful for a user seeking support on our platform. Keep suggestions short and relevant.

Context: "${context}"

Return only the suggestions, one per line, without numbering or formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse suggestions (split by lines and clean up)
    const suggestions = text.split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\d+\./))
      .slice(0, 3);
    
    console.log('✅ [Gemini AI] Generated suggestions successfully');
    return suggestions.length > 0 ? suggestions : getDefaultSuggestions();
    
  } catch (error) {
    console.error('❌ [Gemini AI] Suggestion generation failed:', error);
    return getDefaultSuggestions();
  }
}

/**
 * Get default response suggestions
 * @returns {Array<string>} - Default suggestions
 */
function getDefaultSuggestions() {
  return [
    "Tell me more about financial seminars",
    "How do I find safe shelters?",
    "Where are the nearest donation bins?"
  ];
}

/**
 * Enhanced chat with suggestions
 * @param {string} message - User message
 * @returns {Promise<Object>} - AI response with suggestions
 */
async function chatWithSuggestions(message) {
  try {
    // Get AI response
    const aiResponse = await chatWithAI(message);
    
    // Generate suggestions based on context
    const suggestions = await generateResponseSuggestions(message);
    
    return {
      response: aiResponse,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [Gemini AI] Enhanced chat failed:', error);
    return {
      response: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our support team.",
      suggestions: getDefaultSuggestions(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  chatWithAI,
  chatWithSuggestions,
  generateResponseSuggestions,
  getDefaultSuggestions
};
