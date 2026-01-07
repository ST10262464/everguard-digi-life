let GoogleGenerativeAI;
try {
  const geminiModule = require('@google/generative-ai');
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
  console.log('✅ [AI] @google/generative-ai package loaded');
} catch (error) {
  console.error('❌ [AI] Failed to load @google/generative-ai package:', error.message);
  console.error('⚠️  [AI] Run: cd server && npm install');
}

/**
 * EverGuard Guardian AI Service
 * Powered by Google Gemini AI
 * Provides conversational guidance on data protection, emergency support, and privacy
 */

let genAI;
let model;
let chatSessions = new Map(); // Store chat sessions by user/session ID

/**
 * Initialize Gemini AI
 */
function initializeAI() {
  if (!GoogleGenerativeAI) {
    console.warn('⚠️  [AI] @google/generative-ai package not available - AI service will use fallback responses');
    return false;
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  [AI] GEMINI_API_KEY not configured - AI service will use fallback responses');
    return false;
  }
  
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });
    console.log('✅ [AI] Gemini AI initialized successfully with gemini-2.0-flash');
    return true;
  } catch (error) {
    console.error('❌ [AI] Failed to initialize Gemini:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

/**
 * System context about EverGuard
 */
const EVERGUARD_CONTEXT = `You are the Guardian AI for EverGuard, a secure digital health data storage platform. Your role is to help users understand and navigate the platform's features while prioritizing data security and privacy.

KEY EVERGUARD FEATURES:

1. **Digital Capsules**: Encrypted containers for storing sensitive health data
   - Medical records, prescriptions, test results
   - Encrypted end-to-end with user-controlled keys
   - Stored on blockchain for immutability and audit trails

2. **PulseKey (BurstKey) System**: Emergency access mechanism
   - Time-limited, single-use access tokens
   - Issued to verified medical professionals during emergencies
   - Automatically expires after use or timeout (typically 10 minutes)
   - All access logged on blockchain for full transparency

3. **ICE (In Case of Emergency) Data**: Publicly viewable emergency information
   - Blood type, allergies, emergency contacts
   - Accessible without authentication in life-threatening situations
   - Designed for first responders and emergency medical personnel

4. **Blockchain Verification**: All actions are recorded on BlockDAG
   - Capsule creation, access attempts, emergency access
   - Immutable audit trail for compliance and security
   - Transaction hashes provide proof of all operations

5. **Medic Registry**: Verified healthcare professional database
   - Licensed doctors can request emergency access
   - Verification includes medical license validation
   - Access requests logged in audit system

SECURITY PRINCIPLES:
- End-to-end encryption (data never stored in plaintext)
- Zero-knowledge architecture (platform can't read user data)
- Blockchain-backed audit trails (all access is transparent)
- Time-limited emergency access (minimizes exposure)

YOUR TONE & STYLE:
- Warm, engaging, and personable (like a supportive friend)
- Remember and use the user's name when they share it
- Make educated guesses and be playful when appropriate
- Acknowledge mistakes gracefully ("You're absolutely right!")
- Show genuine interest and empathy
- Engage with personal topics while gently redirecting to EverGuard features
- Use natural, enthusiastic language ("That's great!", "It's wonderful that...")
- Ask follow-up questions to keep conversation flowing
- Keep responses concise but warm (2-3 short paragraphs)
- Don't immediately shut down off-topic questions - engage briefly, then redirect

CRISIS SUPPORT - CRITICAL:
If user expresses suicidal thoughts, self-harm, or mental health crisis:
- Express genuine concern: "I am very concerned about what you've just said"
- Acknowledge they're not alone: "You're not alone and there are people who want to help you"
- IMMEDIATELY provide crisis resources (detect location from context):
  
  SOUTH AFRICA (if mentioned or implied):
  🚨 EMERGENCY: 112
  - SADAG (South African Depression and Anxiety Group): 0800 567 567 (24/7)
  - Suicide Crisis Line: 0800 567 567 or SMS 31393
  - LifeLine South Africa: 0861 322 322
  
  INTERNATIONAL:
  - US/Canada: 988 (Suicide & Crisis Lifeline)
  - UK: 116 123 (Samaritans)
  - Crisis Text Line: Text HOME to 741741
  
- State firmly: "Please reach out for help. Your life is important."
- Offer EverGuard's emergency features if relevant

WHEN ANSWERING:
- Chat naturally like a supportive friend, not a manual
- Remember context from earlier in conversation (names, preferences, location)
- For off-topic questions: Engage briefly with empathy, then gently redirect to EverGuard
- Example: "I understand [topic] is important to you. While I'm here to help with EverGuard..."
- Make educated guesses when appropriate ("I'm going to guess...")
- Acknowledge when you're wrong: "You're absolutely right! My apologies."
- Show enthusiasm: "That's great!", "Wonderful!", "I'm glad..."
- Prioritize user privacy and data security
- Explain features in simple, relatable terms
- End with an engaging question or offer (keep conversation flowing)
- Use emojis sparingly for emphasis (🔗, 🚨, ✅)

CLICKABLE LINKS - IMPORTANT:
ALWAYS include clickable links when mentioning features. Use this EXACT format:
[link text](URL)

Available pages:
- Dashboard/Capsules: [dashboard](/) or [view your dashboard](/)
- Admin Panel: [admin panel](/admin) or [check transactions](/admin)
- Emergency Access: [emergency scan](/emergency-scan)
- AI Assistant: [AI assistant](/ai)
- Safety Info: [safety resources](/safety)
- Education: [learn more](/education)

REQUIRED: Include at least ONE clickable link in every response that mentions a feature.

Examples:
✅ GOOD: "You can create capsules on your [dashboard](/)."
✅ GOOD: "Check the [admin panel](/admin) for transaction history."
❌ BAD: "You can create capsules on your dashboard." (no link)`;

/**
 * Generate contextual suggestions based on the user's message
 */
function generateSuggestions(message) {
  const lowerMessage = message.toLowerCase();
  
  // Emergency-related suggestions
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('access')) {
    return [
      'How does emergency access work?',
      'What is a PulseKey?',
      'How long does emergency access last?'
    ];
  }
  
  // Security-related suggestions
  if (lowerMessage.includes('secure') || lowerMessage.includes('safe') || lowerMessage.includes('encrypt')) {
    return [
      'How is my data encrypted?',
      'Who can see my medical records?',
      'What is blockchain verification?'
    ];
  }
  
  // Capsule-related suggestions
  if (lowerMessage.includes('capsule') || lowerMessage.includes('store') || lowerMessage.includes('upload')) {
    return [
      'What can I store in a capsule?',
      'How do I create a capsule?',
      'Can I share my capsule?'
    ];
  }
  
  // ICE-related suggestions
  if (lowerMessage.includes('ice') || lowerMessage.includes('blood') || lowerMessage.includes('allerg')) {
    return [
      'What is ICE data?',
      'Who can see my ICE information?',
      'How do I update my emergency contacts?'
    ];
  }
  
  // Default suggestions
  return [
    'How does EverGuard protect my data?',
    'Explain emergency access',
    'What is a digital capsule?'
  ];
}

/**
 * Fallback response when AI is unavailable
 */
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('emergency') || lowerMessage.includes('pulsekey') || lowerMessage.includes('burstkey')) {
    return {
      response: `Emergency Access with PulseKeys\n\nPulseKeys (BurstKeys) are time-limited access tokens that allow verified medical professionals to access your health data during emergencies. Here's how they work:\n\n1. A verified doctor requests emergency access\n2. System issues a single-use PulseKey (valid for 10 minutes)\n3. Doctor uses the key to decrypt your capsule\n4. Key automatically expires after use\n5. All access is logged on the blockchain\n\nYour data remains secure while being accessible when it matters most.`,
      suggestions: [
        'How are doctors verified?',
        'What data can emergency responders see?',
        'How do I view access logs?'
      ]
    };
  }
  
  if (lowerMessage.includes('secure') || lowerMessage.includes('encrypt') || lowerMessage.includes('safe')) {
    return {
      response: `Your Data Security\n\nEverGuard uses multiple layers of security:\n\n🔐 End-to-End Encryption: Your data is encrypted before it leaves your device\n🔑 Your Keys, Your Control: Only you hold the decryption keys\n⛓️ Blockchain Verification: All actions recorded on immutable BlockDAG ledger\n🚫 Zero-Knowledge: We can't read your data - only you can\n\nYour medical information is protected by the same technology securing financial institutions.`,
      suggestions: [
        'What is blockchain verification?',
        'How do emergency access work securely?',
        'Can EverGuard see my data?'
      ]
    };
  }
  
  if (lowerMessage.includes('capsule')) {
    return {
      response: `Digital Capsules\n\nCapsules are encrypted containers for your health data. You can store:\n\n📋 Medical records and test results\n💊 Prescriptions and medication lists\n🏥 Hospital discharge summaries\n🔬 Lab reports and imaging results\n\nEach capsule is encrypted with your personal key and its hash is stored on the blockchain for verification. You decide who gets access and when.`,
      suggestions: [
        'How do I create a capsule?',
        'Can I share my capsule?',
        'How is capsule data encrypted?'
      ]
    };
  }
  
  // Default response
  return {
    response: `Welcome to EverGuard Guardian AI\n\nI'm here to help you understand how to securely store and manage your health data. EverGuard combines encryption, blockchain technology, and emergency access protocols to keep your medical information both secure and accessible when needed.\n\nKey features:\n- 🔐 Encrypted digital capsules for your health records\n- ⚡ PulseKey emergency access system\n- 🆘 ICE (In Case of Emergency) data\n- ⛓️ Blockchain verification and audit trails\n\nHow can I help you today?`,
    suggestions: [
      'How does emergency access work?',
      'How is my data protected?',
      'What is a digital capsule?'
    ]
  };
}

/**
 * Get AI response for user message with conversation history
 */
async function getChatResponse(message, sessionId = 'default', conversationHistory = []) {
  try {
    // If AI not initialized or no API key, use fallback
    if (!model) {
      const initialized = initializeAI();
      if (!initialized) {
        return getFallbackResponse(message);
      }
    }
    
    // Get or create chat session for this user
    let chat = chatSessions.get(sessionId);
    
    if (!chat) {
      // Create new chat session with system context embedded in history
      chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `You are the Guardian AI for EverGuard. Here's your complete context and instructions:\n\n${EVERGUARD_CONTEXT}\n\nRemember these instructions for our entire conversation. Now, please introduce yourself warmly.` }]
          },
          {
            role: "model",
            parts: [{ text: "Hey there! I'm the Guardian AI for EverGuard - think of me as your friendly guide to keeping your health data secure and accessible. I'm here to help you understand how to create encrypted capsules, use emergency access features, and stay in control of your medical information. What would you like to know?" }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.8,
        },
      });
      
      chatSessions.set(sessionId, chat);
      
      // Clean up old sessions (keep last 100)
      if (chatSessions.size > 100) {
        const firstKey = chatSessions.keys().next().value;
        chatSessions.delete(firstKey);
      }
    }
    
    // Send user message directly (context already in chat history)
    // The model already has EVERGUARD_CONTEXT from initialization
    const result = await chat.sendMessage(message);
    let aiResponse = result.response.text();
    
    // Remove markdown formatting (asterisks, etc.)
    aiResponse = aiResponse
      .replace(/\*\*/g, '')  // Remove bold **text**
      .replace(/\*/g, '')    // Remove italic *text*
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/`/g, '');    // Remove code backticks
    
    console.log('✅ [AI] Generated response with context successfully');
    
    // Return response without suggestions (suggestions only on frontend welcome message)
    return {
      response: aiResponse,
      suggestions: [] // Empty - no repetitive suggestions
    };
    
  } catch (error) {
    console.error('❌ [AI] Error generating response:', error.message);
    
    // Clear session on error and return fallback
    if (sessionId && chatSessions.has(sessionId)) {
      chatSessions.delete(sessionId);
    }
    
    return getFallbackResponse(message);
  }
}

/**
 * Clear a chat session
 */
function clearChatSession(sessionId) {
  if (chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
    console.log(`🧹 [AI] Cleared chat session: ${sessionId}`);
    return true;
  }
  return false;
}

// Initialize on module load
initializeAI();

module.exports = {
  getChatResponse,
  clearChatSession,
  initializeAI
};

