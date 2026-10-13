import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { API } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am **DisasterGuard Assistant**, your AI decision-support advisor aligned with **UN SDG 13 (Climate Action)**.\n\nI can assist you with:\n- **Immediate Hazard Safety**: Step-by-step actions for floods, cyclones, heatwaves, wildfires, and landslides.\n- **72-Hour Survival Go-Bag**: Essential water, medical, communication, and document checklists.\n- **Household Emergency Plans**: Family reunification protocols and defensible space preparation.\n- **Climate Resilience Awareness**: Understanding extreme weather risks.\n\n⚠️ *Emergency Note: In active life-threatening emergencies, prioritize official emergency responder directives and dial 112 / 911 immediately.*`,
      model: 'DisasterGuard Core',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What essential items belong in a 72-hour flood go-bag?',
    'What are the immediate home preparation steps before a cyclone makes landfall?',
    'How do I recognize early warning signs of an impending hillside landslide?',
    'What precautions protect against severe wet-bulb heatwaves?',
    'How does UN SDG 13 Target 13.1 connect with early warning systems?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await API.chatWithAssistant(userMsg.content, history);
      
      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        model: response.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Unable to reach the assistant service at this moment. Please verify server connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">DisasterGuard AI Assistant</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Powered by Gemini 3.8-Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive preparedness guidance & disaster decision support (UN SDG 13)
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-[10px] text-slate-500 font-mono">Server-Side Proxy</div>
          <div className="text-[11px] text-emerald-400 font-mono">Secured & Shielded</div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 to-sky-600 flex items-center justify-center text-white text-xs shrink-0 mt-0.5 shadow">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs shadow-md leading-relaxed ${
                  isUser
                    ? 'bg-rose-600 text-white rounded-tr-none'
                    : 'bg-slate-850 text-slate-200 border border-slate-700/70 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10 text-[10px] opacity-75 font-mono">
                  <span>{isUser ? 'Operations User' : 'DisasterGuard AI'}</span>
                  <div className="flex items-center gap-1.5">
                    {m.model && <span className="text-cyan-300">[{m.model}]</span>}
                    <span>{m.timestamp}</span>
                  </div>
                </div>

                {/* Render with basic markdown-friendly linebreaks */}
                <div className="whitespace-pre-wrap space-y-2">
                  {m.content}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400 pl-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
            </div>
            <span>Analyzing hazard knowledge base and formulating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] shrink-0">
        <span className="text-slate-500 font-mono text-[10px] uppercase shrink-0">Suggested:</span>
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask DisasterGuard Assistant regarding flood readiness, storm kits, fire perimeters, or safety protocols..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
