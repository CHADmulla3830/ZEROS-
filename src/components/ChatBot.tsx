import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Sparkles } from 'lucide-react';
import { getGeminiAI } from '../lib/gemini';
import { ThinkingLevel } from '@google/genai';
import Markdown from 'react-markdown';
import { Product } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC<{ products: Product[]; onClose: () => void }> = ({ products, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I am your ZEROS' AI Assistant. How can I help you today? I can help you find games, explain top-up processes, or answer questions about bKash/Nagad payments." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getGeminiAI();
      const productList = products.slice(0, 20).map(p => `${p.name} (৳${p.price}) - ${p.genre}`).join(', ');
      const systemInstruction = `You are an expert gaming assistant for ZEROS', a gaming marketplace in Bangladesh. 
      You help users with game top-ups, gift cards, and digital keys. 
      Be helpful, polite, and use a friendly tone. Mention that payments are only accepted via bKash and Nagad.
      Here are some products currently available on the site: ${productList}.
      Only answer questions about these products and the site. If a user asks for something else, politely decline and offer to help with gaming products.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [...messages, { role: 'user', text: userMessage }].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-[60] overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-semibold">Powered by Gemini 3.1 Pro</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
            }`}>
              <div className="markdown-body">
                <Markdown>{m.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-xs text-gray-500 font-medium">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about games or payments..."
            className="flex-grow px-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
