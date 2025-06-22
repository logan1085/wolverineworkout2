'use client';

import { useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'logan';
  timestamp: Date;
}

export default function MemoryTestChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! I'm Logan with memory! Tell me about your fitness goals and I'll remember them for next time.",
      sender: 'logan',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Send to memory-enhanced API
      const response = await fetch('/api/chat-with-logan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          conversationContext: {
            fitnessLevel: '',
            goals: '',
            timeAvailable: '',
            equipment: '',
            focusAreas: '',
            hasEnoughInfo: false
          },
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const loganResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'logan',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, loganResponse]);

    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble right now. Please try again!",
        sender: 'logan',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 h-96 flex flex-col">
      <h3 className="text-white text-lg font-bold mb-4">🧠 Memory Test Chat (User ID: {userId.slice(-6)})</h3>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-sm px-4 py-2 rounded-lg text-sm ${
                message.sender === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell Logan about your fitness goals..."
          className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
} 