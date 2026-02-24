'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Share2, Copy, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showPassiveAgressive, setShowPassiveAgressive] = useState(false);
  const [currentTypedText, setCurrentTypedText] = useState('');
  const [showShare, setShowShare] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (query && !isTyping && messages.length === 0) {
      startTypingAnimation(decodeURIComponent(query));
    }
  }, [query]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTypedText]);

  const startTypingAnimation = async (text: string) => {
    setIsTyping(true);
    setCurrentTypedText('');
    
    // Type out the question in the input field
    for (let i = 0; i <= text.length; i++) {
      setCurrentTypedText(text.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages([userMessage]);
    setCurrentTypedText('');
    setIsTyping(false);

    // Start streaming AI response
    await streamAIResponse(text);
  };

  const streamAIResponse = async (message: string) => {
    setIsStreaming(true);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + parsed.text }
                    : msg
                ));
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error while processing your request.' }
          : msg
      ));
    } finally {
      setIsStreaming(false);
      setShowPassiveAgressive(true);
    }
  };

  const generateLink = () => {
    if (!inputValue.trim()) return;
    
    const url = `${window.location.origin}/?q=${encodeURIComponent(inputValue.trim())}`;
    navigator.clipboard.writeText(url);
    setShowShare(true);
    setTimeout(() => setShowShare(false), 2000);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/?q=${encodeURIComponent(query || '')}`;
    navigator.clipboard.writeText(url);
  };

  if (!query) {
    // Homepage - Generate Link Mode
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Let Me AI That For You
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                For all those questions that could have been asked to AI directly 🙃
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <div className="mb-6">
                <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-2">
                  What should they have asked AI?
                </label>
                <textarea
                  id="question"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g., How do I center a div?"
                  className="w-full p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <motion.button
                onClick={generateLink}
                disabled={!inputValue.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                whileHover={{ scale: inputValue.trim() ? 1.02 : 1 }}
                whileTap={{ scale: inputValue.trim() ? 0.98 : 1 }}
              >
                <Share2 size={20} />
                Generate Link
              </motion.button>

              <AnimatePresence>
                {showShare && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-green-800 rounded-lg text-center"
                  >
                    ✅ Link copied to clipboard!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <footer className="text-center p-4 text-gray-500">
          <p>Let Me AI That For You - Because some questions deserve a little passive aggression ✨</p>
        </footer>
      </div>
    );
  }

  // Chat Interface Mode
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <MessageSquare size={24} />
          <span className="font-semibold">AI Assistant</span>
        </div>
        
        <div className="flex-1"></div>
        
        <AnimatePresence>
          {showPassiveAgressive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 p-3 rounded-lg text-sm text-center"
            >
              <p className="text-gray-300 mb-2">Could have just asked AI yourself 🙃</p>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 mx-auto text-xs"
              >
                <Copy size={12} />
                Share this link
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 ${message.role === 'user' ? 'ml-12' : ''}`}
              >
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      AI
                    </div>
                  )}
                  <div className={`max-w-2xl ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : 'bg-gray-800 text-white'
                  } rounded-2xl px-4 py-3`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && isStreaming && message.content && (
                      <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="inline-block w-2 h-4 bg-gray-400 ml-1"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 bg-gray-800 rounded-2xl px-4 py-3">
                <input
                  type="text"
                  value={currentTypedText}
                  readOnly={isTyping}
                  placeholder={isTyping ? "" : "Type a message..."}
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none"
                />
                {isTyping && (
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-1 h-4 bg-white ml-1"
                  />
                )}
              </div>
              <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl transition-colors">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}