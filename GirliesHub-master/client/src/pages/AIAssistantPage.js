import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Paper,
  IconButton,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  SmartToy,
  Send,
  Person,
  Clear,
  QuestionAnswer,
  Lightbulb,
} from '@mui/icons-material';
import axios from 'axios';
import { getApiUrl, API_CONFIG } from '../config/api';

const AIAssistantPage = () => {
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
              text: t('aiAssistant.welcomeMessage') || "Hello! I'm your GirliesHub AI assistant. I'm here to help you with financial empowerment, GBV support, sanitary aid, and general platform guidance. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        'How can I find financial seminars?',
        'I need safe shelter information',
        'Where are sanitary product donation bins?',
        'How do I submit a support request?'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    t('aiAssistant.quickQuestions.questions.financialSeminars') || 'How can I find financial seminars?',
    t('aiAssistant.quickQuestions.questions.safeShelters') || 'I need safe shelter information',
    t('aiAssistant.quickQuestions.questions.sanitaryProducts') || 'Where are sanitary product donation bins?',
    t('aiAssistant.quickQuestions.questions.submitRequest') || 'How do I submit a support request?',
    t('aiAssistant.quickQuestions.questions.availableServices') || 'What services are available?',
    'What emergency numbers should I call?',
    'I need immediate help - what do I do first?',
    'Who can I contact for immediate support?',
    'What should I do if I feel unsafe?',
    'How do I get emergency transportation?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset to welcome message when language changes to avoid stuck translations
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: t('aiAssistant.welcomeMessage'),
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
  }, [t]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Use enhanced AI chat with suggestions
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.AI_CHAT_ENHANCED), {
        message: inputMessage
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: response.data.suggestions || []
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error calling AI API:', error);
      setError('Failed to get AI response. Please try again.');
      
      // Fallback response with translation support
      const fallbackText = t('aiAssistant.errorMessage') || "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or contact our support team if you need immediate assistance.";
      
      const botMessage = {
        id: Date.now() + 1,
        text: fallbackText,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Try again', 'Contact support', 'Check our help pages']
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: t('aiAssistant.welcomeMessage') || "Hello! I'm your GirliesHub AI assistant. I'm here to help you with financial empowerment, GBV support, sanitary aid, and general platform guidance. How can I assist you today?",
        sender: 'bot',
        timestamp: new Date(),
        suggestions: [
          'How can I find financial seminars?',
          'I need safe shelter information',
          'Where are sanitary product donation bins?',
          'How do I submit a support request?'
        ]
      }
    ]);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const closeError = () => {
    setError('');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <SmartToy sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('aiAssistant.title') || 'AI Assistant'}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {t('aiAssistant.subtitle') || 'Get help with financial empowerment, GBV support, sanitary aid, and platform guidance powered by Gemini AI'}
          </Typography>
        </Box>

        {/* Quick Questions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
            {t('aiAssistant.quickQuestions.title') || 'Quick Questions:'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {quickQuestions.map((question, index) => (
              <Chip
                key={index}
                label={question}
                variant="outlined"
                onClick={() => handleQuickQuestion(question)}
                sx={{ 
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Chat Container */}
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '70vh', maxHeight: '90vh' }}>
          {/* Chat Header */}
          <CardContent sx={{ pb: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {t('aiAssistant.chat.assistantName') || 'AI Assistant'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('aiAssistant.chat.status') || 'Powered by Gemini AI • Available 24/7'}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={clearChat} color="error">
                <Clear />
              </IconButton>
            </Box>
          </CardContent>

          {/* Messages Area */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      mr: 1, 
                      width: 32, 
                      height: 32 
                    }}
                  >
                    <SmartToy fontSize="small" />
                  </Avatar>
                )}
                
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    borderTopLeftRadius: message.sender === 'bot' ? 0 : 2,
                    borderTopRightRadius: message.sender === 'user' ? 0 : 2,
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                    {message.text}
                  </Typography>
                  
                  {/* Show suggestions if available */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                        <Lightbulb sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        Suggested follow-ups:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {message.suggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestionClick(suggestion)}
                            sx={{ 
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'white',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 1, 
                      opacity: 0.7,
                      fontSize: '0.75rem',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </Paper>

                {message.sender === 'user' && (
                  <Avatar 
                    sx={{ 
                      bgcolor: 'secondary.main', 
                      ml: 1, 
                      width: 32, 
                      height: 32 
                    }}
                  >
                    <Person fontSize="small" />
                  </Avatar>
                )}
              </Box>
            ))}
            
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    mr: 1, 
                    width: 32, 
                    height: 32 
                  }}
                >
                  <SmartToy />
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                    borderTopLeftRadius: 0,
                  }}
                >
                  <Typography variant="body1">
                    {t('aiAssistant.chat.typing') || 'Thinking...'}
                  </Typography>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('aiAssistant.chat.placeholder')}
                variant="outlined"
                size="small"
                disabled={isLoading}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                sx={{ 
                  minWidth: 'auto', 
                  px: 2,
                  height: 'fit-content',
                  alignSelf: 'flex-end',
                }}
              >
                <Send />
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('aiAssistant.chat.keyboardHint')}
            </Typography>
          </Box>
        </Card>

        {/* Footer Info */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <QuestionAnswer sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            {t('aiAssistant.footer') || 'For immediate emergency assistance, call 0800 428 428 (GBV Command Centre) or 10111 (Police)'}
          </Typography>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={closeError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AIAssistantPage;
