import React, { useState, useEffect, useRef } from 'react';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import { speakKannada, stopSpeaking } from '../utils/speech';
import { AudioTranscriberModal } from './AudioTranscriberModal';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  User,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  GraduationCap,
  Coffee,
  RotateCcw,
  Loader2,
  ChevronDown,
  Cpu,
} from 'lucide-react';

interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
}

interface ChatbotRole {
  id: string;
  name: string;
  kannadaName: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  badgeColor: string;
}

const ROLES: ChatbotRole[] = [
  {
    id: 'tutor',
    name: 'Master Ananth',
    kannadaName: 'ಅನಂತ ಮಾಸ್ಟರ್',
    title: 'Patient Language Tutor',
    desc: 'Teaches everyday conversation, phonetics, and culture with kindness.',
    icon: GraduationCap,
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'local_buddy',
    name: 'Chetan',
    kannadaName: 'ಚೇತನ್',
    title: 'Bengaluru Local Buddy',
    desc: 'Street-smart techie who teaches local slang, auto tips, and casual Kannada.',
    icon: Coffee,
    badgeColor: 'bg-amber-100 text-amber-900',
  },
  {
    id: 'grammar_expert',
    name: 'Dr. Shanthamma',
    kannadaName: 'ಡಾ. ಶಾಂತಮ್ಮ',
    title: 'Grammar & Linguistics Professor',
    desc: 'Deep linguistic breakdown, verb tenses, and formal vs informal rules.',
    icon: Sparkles,
    badgeColor: 'bg-purple-100 text-purple-900',
  },
];

interface GeminiChatbotViewProps {
  currentLanguage: string;
}

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({
  currentLanguage,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('tutor');
  const [complexityTier, setComplexityTier] = useState<'fast' | 'general' | 'complex'>('general');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranscribeModalOpen, setIsTranscribeModalOpen] = useState<boolean>(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;
  const { user } = useAuth();

  const activeRole = ROLES.find(r => r.id === selectedRoleId) || ROLES[0];

  // Initialize initial greeting when role changes
  useEffect(() => {
    const greetings: Record<string, string> = {
      tutor: `ನಮಸ್ಕಾರ! (Namaskara!) I am Master Ananth. Welcome to your personalized Kannada journey. I will explain everything in Kannada and your mother tongue (${langConfig.name}). What would you like to practice today?`,
      local_buddy: `ಹಾಯ್ ಗುರು! (Hi Guru!) I am Chetan. Ready to talk like a true Bengalurean? Ask me how to bargain with auto drivers, order that perfect benne dose, or talk with colleagues!`,
      grammar_expert: `ನಮಸ್ಕಾರ. I am Dr. Shanthamma. Feel free to ask about sentence structure, verb conjugations, case markers (Vibhakti), or comparative roots between Kannada and ${langConfig.name}.`,
    };

    setMessages([
      {
        id: 'msg_welcome',
        role: 'model',
        content: greetings[selectedRoleId] || greetings.tutor,
        modelUsed:
          complexityTier === 'fast'
            ? 'gemini-3.1-flash-lite'
            : complexityTier === 'complex'
            ? 'gemini-4-argon'
            : 'gemini-3.8-flash',
      },
    ]);
  }, [selectedRoleId, currentLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessageItem = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRoleId,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          userMessage: text,
          targetLanguage: langConfig.name,
          taskComplexity: complexityTier,
        }),
      });

      if (!response.ok) {
        throw new Error('Chatbot request failed');
      }

      const data = await response.json();
      const aiMsg: ChatMessageItem = {
        id: `ai_${Date.now()}`,
        role: 'model',
        content: data.reply || 'ಧನ್ಯವಾದಗಳು. ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ.',
        modelUsed: data.modelUsed,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.warn('Chatbot error, showing fallback:', err);
      const fallbackMsg: ChatMessageItem = {
        id: `ai_${Date.now()}`,
        role: 'model',
        content: `ಹೌದು (Haudu)! You asked: "${text}". In Bengaluru, you can say: "ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡಿ" (Swalpa sahaaya maadi - Please help a little).`,
        modelUsed: 'gemini-3.8-flash',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const starterPrompts = [
    'How do I politely say "I am not from here" in Kannada?',
    'Teach me 5 colloquial Bengaluru slang words with meanings.',
    'What is the difference between "Beku" and "Beda"?',
    'How to ask a landlord about water and power backup?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Chatbot Header & Role Selector */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-red-600" />
              <span>Multi-Turn Gemini Chatbot</span>
            </div>
            <h2 className="text-xl font-black text-stone-900 mt-1">
              {activeRole.name} ({activeRole.kannadaName})
            </h2>
            <p className="text-xs text-stone-500">{activeRole.title} • {activeRole.desc}</p>
          </div>

          {/* Model complexity selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> Model:
            </span>
            <div className="inline-flex rounded-xl bg-stone-100 p-0.5 text-xs font-bold">
              <button
                onClick={() => setComplexityTier('fast')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  complexityTier === 'fast'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="gemini-3.1-flash-lite: Fast response speed"
              >
                Fast (3.1 Lite)
              </button>
              <button
                onClick={() => setComplexityTier('general')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  complexityTier === 'general'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="gemini-3.8-flash: General tasks"
              >
                General (3.8 Flash)
              </button>
              <button
                onClick={() => setComplexityTier('complex')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  complexityTier === 'complex'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="gemini-4-argon: Complex linguistic reasoning"
              >
                Complex (4-Argon)
              </button>
            </div>
          </div>
        </div>

        {/* Roles tab chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {ROLES.map(role => {
            const Icon = role.icon;
            const isSelected = role.id === selectedRoleId;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'border-red-600 bg-red-50 text-red-950 shadow-xs'
                    : 'border-stone-200 bg-stone-50/70 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-stone-400'}`} />
                <span>{role.name}</span>
                <span className="text-[10px] font-kannada font-normal text-stone-500">
                  ({role.kannadaName})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="bg-stone-50/70 rounded-3xl border border-stone-200 p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isAi = msg.role === 'model';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isAi ? 'max-w-[90%] sm:max-w-[85%]' : 'ml-auto max-w-[85%] justify-end'
              }`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-1">
                <div
                  className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isAi
                      ? 'bg-white border border-stone-200/90 text-stone-800 shadow-xs rounded-tl-sm'
                      : 'bg-red-600 text-white shadow-xs rounded-tr-sm font-medium'
                  }`}
                >
                  {msg.content}
                </div>

                {/* AI audio listen & model tag */}
                {isAi && (
                  <div className="flex items-center gap-2 pl-2 text-[10px] text-stone-400">
                    <button
                      onClick={async () => {
                        if (playingMessageId === msg.id) {
                          stopSpeaking();
                          setPlayingMessageId(null);
                          return;
                        }
                        setPlayingMessageId(msg.id);
                        await speakKannada(msg.content, {
                          onStart: () => setPlayingMessageId(msg.id),
                          onEnd: () => setPlayingMessageId(null),
                          onError: () => setPlayingMessageId(null),
                        });
                      }}
                      className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                        playingMessageId === msg.id
                          ? 'text-red-600 animate-pulse font-bold'
                          : 'hover:text-red-700 text-stone-500'
                      }`}
                      aria-label="Listen to message audio"
                    >
                      {playingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-red-600" />
                          <span>Playing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                    {msg.modelUsed && (
                      <>
                        <span>•</span>
                        <span className="font-mono bg-stone-100 px-1 rounded text-stone-500">
                          {msg.modelUsed}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold pl-11">
            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
            <span>{activeRole.name} is writing with {complexityTier === 'fast' ? 'gemini-3.1-flash-lite' : complexityTier === 'complex' ? 'gemini-4-argon' : 'gemini-3.8-flash'}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Prompts */}
      {messages.length <= 1 && (
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Suggested Questions to ask {activeRole.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left transition-all font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input with Microphone (gemini-3.5-transcribe) */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-300 shadow-sm focus-within:ring-2 focus-within:ring-red-500"
      >
        <button
          type="button"
          onClick={() => setIsTranscribeModalOpen(true)}
          className="p-2.5 rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Voice input with gemini-3.5-transcribe"
          aria-label="Voice transcription input"
        >
          <Mic className="w-5 h-5 text-red-600" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder={`Ask ${activeRole.name} anything about Kannada, grammar, or Bengaluru culture...`}
          className="flex-1 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

      {/* Audio Transcription Modal */}
      <AudioTranscriberModal
        isOpen={isTranscribeModalOpen}
        onClose={() => setIsTranscribeModalOpen(false)}
        onTranscriptionComplete={text => {
          setInputMessage(text);
          // auto-send for fluid voice experience
          handleSendMessage(text);
        }}
      />
    </div>
  );
};
