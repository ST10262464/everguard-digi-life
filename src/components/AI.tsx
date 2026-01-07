import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Send,
  User,
  X,
  MessageCircle,
  Lightbulb,
  Bot,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import axios from 'axios';
import { API_URL } from '@/config/api';

/**
 * EverGuard Guardian AI Console
 * A conversational interface for guidance on data protection, emergency support,
 * legal legacy, and privacy advice – powered by Gemini AI.
 */
const EverGuardGuardianPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `${t('ai.welcomeMessage')}
${t('emergency.ifEmergency')}:
• ${t('emergency.gbvHotline')}
• ${t('emergency.police')}
• ${t('emergency.medical')}
${t('ai.howCanIHelp')}`,
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        t('ai.suggestions.setupEmergency'),
        t('ai.suggestions.secureDocuments'),
        t('ai.suggestions.digitalWill')
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickQuestions = [
    'How do I create a secure data vault?',
    'What is an Emergency Capsule?',
    'How do I store my ID documents safely?',
    'How can I set up digital will sharing?',
    'What are the GBV emergency contacts?',
    'How do I protect my personal data online?',
    'Can EverGuard notify my emergency contact?',
    'Where can I find nearby shelters or legal aid?',
    'How do I recover my account if I lose access?',
    'What does the Guardian AI actually protect?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      suggestions: [],
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/ai/chat/enhanced`, {
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
      console.error('Error calling EverGuard AI:', error);
      setError('Guardian AI is currently unavailable. Please try again soon.');

      const fallback = {
        id: Date.now() + 1,
        text: "I'm unable to connect right now, but your data and messages are secure. Please try again later or contact support if urgent.",
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Try again', 'View support options', 'Read safety guidelines']
      };
      setMessages(prev => [...prev, fallback]);
      
      toast({
        title: "AI Service Unavailable",
        description: "The Guardian AI is currently offline. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: `Hello, I'm your EverGuard Guardian Assistant — your digital partner for safety, privacy, and peace of mind.
If this is an emergency, please contact:
• GBV Command Centre: 0800 428 428  
• Police: 10111  
• Medical: 112  
How can I support you today?`,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: [
          'Set up an Emergency Capsule',
          'Secure my ID documents',
          'Learn how to manage my digital will'
        ]
      }
    ]);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('ai.title')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('ai.subtitle')}
            </p>
          </div>
        </div>

        {/* Quick Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Container */}
        <Card className="flex flex-col h-[70vh]">
          {/* Chat Header */}
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Avatar className="bg-primary">
                  <AvatarFallback>
                    <Shield className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">EverGuard Guardian Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Powered by Gemini AI • Always protecting
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className="w-8 h-8 bg-primary">
                        <AvatarFallback>
                          <Shield className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>

                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lightbulb className="w-3 h-3" />
                            Suggested next steps:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8 bg-secondary">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <Avatar className="w-8 h-8 bg-primary">
                      <AvatarFallback>
                        <Shield className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">Processing securely...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <Separator />

          {/* Input */}
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('ai.placeholder')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Footer - Fixed to bottom with proper spacing */}
        <div className="mt-4 mb-8">
          <Alert className="bg-muted/50">
            <MessageCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Need emergency help? Call 0800 428 428 (GBV Command Centre) • 10111 (Police) • 112 (Medical)
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default EverGuardGuardianPage;