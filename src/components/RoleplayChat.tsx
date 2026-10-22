import React, { useState, useEffect, useRef } from 'react';
import { SCENARIOS, ScenarioItem } from '../utils/kannada';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import { speakKannada, stopSpeaking } from '../utils/speech';
import {
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Lightbulb,
  Check,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  kannada?: string;
  transliteration?: string;
  translation?: string;
  correction?: string;
  quickReplies?: string[];
}

interface RoleplayChatProps {
  currentLanguage: string;
  initialScenarioId?: string;
  onRecordRoleplayCompleted: (scenarioId: string) => void;
}

export const RoleplayChat: React.FC<RoleplayChatProps> = ({
  currentLanguage,
  initialScenarioId = 'hospital',
  onRecordRoleplayCompleted,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;

  const currentScenario =
    SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  // Initialize or reset chat for selected scenario
  useEffect(() => {
    resetScenarioChat(selectedScenarioId);
  }, [selectedScenarioId, currentLanguage]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const resetScenarioChat = (scenarioId: string) => {
    const sc = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];

    // Initial greeting per scenario
    const greetings: Record<string, { kannada: string; translit: string; translation: string; quickReplies: string[] }> = {
      hospital: {
        kannada: 'ನಮಸ್ಕಾರ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ತಗೊಂಡಿದ್ದೀರಾ? ಡಾಕ್ಟರ್ 11 ಗಂಟೆಗೆ ಸಿಗ್ತಾರೆ.',
        translit: currentLanguage === 'hi'
          ? 'नमस्कार, अपॉइंटमेंट तगोंडिद्दीरा? डॉक्टर 11 गंटेगे सिगत्तारे.'
          : 'Namaskaara, appointment tagondiddiraa? Doctor 11 gantege sigtaare.',
        translation: 'Hello, have you taken an appointment? Doctor is available at 11 AM.',
        quickReplies: ['ಇಲ್ಲ, ಈಗ ತಗೋಬೇಕು (No, I need to take now)', 'ಹೌದು, ತಗೊಂಡಿದ್ದೀನಿ (Yes, I have taken)'],
      },
      travel: {
        kannada: 'ಬನ್ನಿ ಸರ್, ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು? ಮೀಟರ್ ಹಾಕ್ತೀನಿ.',
        translit: currentLanguage === 'hi'
          ? 'बन्नी सर, एल्लिगे होग्बेकु? मीटर हाक्तिनी.'
          : 'Banni sir, ellige hogbeku? Meter haaktini.',
        translation: 'Come sir, where do you want to go? I will put the meter.',
        quickReplies: ['ಇಂದಿರಾನಗರಕ್ಕೆ ಹೋಗ್ಬೇಕು (Need to go to Indiranagar)', 'ಮೆಜೆಸ್ಟಿಕ್‌ಗೆ ಎಷ್ಟು ಆಗುತ್ತೆ? (How much to Majestic?)'],
      },
      shopping: {
        kannada: 'ನಮಸ್ತೆ ಸರ್, ತಾಜಾ ತರಕಾರಿ ಇದೆ. ಏನು ಬೇಕು?',
        translit: currentLanguage === 'hi'
          ? 'नमस्ते सर, ताजा तरकारि इदे. एनु बेकु?'
          : 'Namaste sir, taajaa tarakaari ide. Enu beku?',
        translation: 'Hello sir, we have fresh vegetables. What do you need?',
        quickReplies: ['ಟೊಮ್ಯಾಟೊ ಎಷ್ಟು ರೂಪಾಯಿ? (How much is tomato?)', 'ಒಂದು ಕೆಜಿ ಈರುಳ್ಳಿ ಕೊಡಿ (Give 1 kg onion)'],
      },
      college: {
        kannada: 'ಹಾಯ್, ಕ್ಲಾಸ್ 10 ಗಂಟೆಗೆ ಶುರು ಆಗುತ್ತೆ. ಲೈಬ್ರರಿಗೆ ಹೋಗೋಣ್ವಾ?',
        translit: currentLanguage === 'hi'
          ? 'हाय, क्लास 10 गंटेगे शुरू आगूत्ते. लाइब्रेरी-गे होगोण्व?'
          : 'Hi, class 10 gantege shuru aagutte. Library-ge hogonwaa?',
        translation: 'Hi, class starts at 10 AM. Shall we head to the library?',
        quickReplies: ['ಹೌದು, ಹೋಗೋಣ (Yes, let us go)', 'ಕ್ಯಾಂಟೀನ್‌ನಲ್ಲಿ ಕಾಫಿ ಕುಡಿಯೋಣ (Let us have coffee in canteen)'],
      },
      workplace: {
        kannada: 'ಹೇಗಿದ್ದೀರಾ? ಮೀಟಿಂಗ್ ಲಿಂಕ್ ಕಳುಹಿಸಿದ್ದೀನಿ, ಚೆಕ್ ಮಾಡಿ.',
        translit: currentLanguage === 'hi'
          ? 'हेगिद्दीरा? मीटिंग लिंक कळुहिसिद्दीनि, चेक माडि.'
          : 'Hegiddeera? Meeting link kaluhisiddini, check maadi.',
        translation: 'How are you? I have sent the meeting link, please check.',
        quickReplies: ['ಧನ್ಯವಾದ, ಚೆಕ್ ಮಾಡ್ತೀನಿ (Thanks, I will check)', 'ಕಾಫಿ ಕುಡಿಯೋಣ ಬನ್ನಿ (Come, let us grab coffee)'],
      },
      daily_life: {
        kannada: 'ನಮಸ್ಕಾರ, ಊಟ ಆಯ್ತಾ? ಇವತ್ತು ಕರೆಂಟ್ ಇರುತ್ತೆ ತಾನೇ?',
        translit: currentLanguage === 'hi'
          ? 'नमस्कार, ऊट आय्ता? इवत्तु करंट इरुत्ते ताने?'
          : 'Namaskaara, oota aaytaa? Ivattu current irutte taane?',
        translation: 'Hello, did you eat? Electricity will be there today, right?',
        quickReplies: ['ಹೌದು, ಆಯ್ತು (Yes, finished)', 'ಕಸದ ಗಾಡಿ ಬಂತಾ? (Did garbage vehicle come?)'],
      },
    };

    const g = greetings[scenarioId] || greetings.hospital;

    const initialAiMessage: ChatMessage = {
      id: 'msg_0',
      sender: 'ai',
      text: g.kannada,
      kannada: g.kannada,
      transliteration: g.translit,
      translation: g.translation,
      correction: 'Welcome to this roleplay! Try replying in simple Kannada or in your native language.',
      quickReplies: g.quickReplies,
    };

    setMessages([initialAiMessage]);
    setErrorMessage(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: currentScenario.id,
          scenarioTitle: currentScenario.title,
          roleName: currentScenario.roleplayRole,
          history: messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          userMessage: text,
          targetLanguage: langConfig.name,
          scriptName: langConfig.scriptName,
        }),
      });

      if (!response.ok) {
        throw new Error('Roleplay API temporary issue');
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.kannada,
        kannada: data.kannada,
        transliteration: data.transliteration,
        translation: data.translation,
        correction: data.correction,
        quickReplies: data.quickReplies,
      };

      setMessages(prev => [...prev, aiMsg]);
      onRecordRoleplayCompleted(currentScenario.id);

      // Play pronunciation of the AI's Kannada reply automatically for immersion
      speakKannada(data.kannada);
    } catch (err: any) {
      console.warn('AI roleplay request error, showing fallback:', err);
      // Resilient local simulation fallback
      const fallbackAiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: 'ಹೌದು, ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಮುಂದುವರಿಸಿ!',
        kannada: 'ಹೌದು, ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಮುಂದುವರಿಸಿ!',
        transliteration: currentLanguage === 'hi' ? 'हाँ, नानु अर्थमाडिकोण्डे. मुन्दुवरिसि!' : 'Haudu, naanu artha maadikonnde. Munduvarisi!',
        translation: 'Yes, I understood. Please continue!',
        correction: 'Great conversation effort! In Kannada, "Haudu" means "Yes".',
        quickReplies: ['ಧನ್ಯವಾದಗಳು (Thank you)', 'ಮತ್ತೆ ಸಿಗೋಣ (See you again)'],
      };
      setMessages(prev => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const latestAiMessage = [...messages].reverse().find(m => m.sender === 'ai');

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Scenario Character Selector Header */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="text-xs font-bold text-red-600 uppercase tracking-wider">
              AI Roleplay Partner
            </div>
            <h2 className="text-xl font-black text-stone-900">
              {currentScenario.roleplayRole}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentScenario.title} • {currentScenario.roleplayIntro}
            </p>
          </div>

          <button
            onClick={() => resetScenarioChat(selectedScenarioId)}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Restart conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Persona quick switch buttons */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          {SCENARIOS.map(s => {
            const isSelected = s.id === selectedScenarioId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedScenarioId(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {s.roleplayRole}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio notice banner if speech blocked or phonetic fallback */}
      {audioNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{audioNotice}</span>
          </div>
          <button
            onClick={() => setAudioNotice(null)}
            className="text-amber-800 hover:text-amber-950 font-bold px-1"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-stone-50/70 rounded-3xl border border-stone-200 p-4 sm:p-6 min-h-[380px] max-h-[520px] overflow-y-auto space-y-4">
        {messages.map(msg => {
          if (msg.sender === 'ai') {
            return (
              <div key={msg.id} className="flex items-start gap-3 max-w-[90%] sm:max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="space-y-2">
                  <div className="bg-white rounded-3xl rounded-tl-sm p-4 sm:p-5 border border-amber-200 shadow-xs space-y-2">
                    {/* Kannada script */}
                    <div className="text-xl sm:text-2xl font-bold font-kannada text-stone-900 leading-relaxed">
                      {msg.kannada}
                    </div>

                    {/* Transliteration in learner's script */}
                    {msg.transliteration && (
                      <div className="text-xs sm:text-sm font-semibold text-red-700">
                        {msg.transliteration}
                      </div>
                    )}

                    {/* Translation in learner's language */}
                    {msg.translation && (
                      <div className={`text-xs text-stone-700 border-t border-stone-100 pt-1.5 ${langConfig.fontClass}`}>
                        <strong>Meaning:</strong> {msg.translation}
                      </div>
                    )}

                    {/* Listen button */}
                    <button
                      onClick={async () => {
                        if (!msg.kannada) return;
                        if (playingMessageId === msg.id) {
                          stopSpeaking();
                          setPlayingMessageId(null);
                          return;
                        }
                        setPlayingMessageId(msg.id);
                        const res = await speakKannada(msg.kannada, {
                          onStart: () => setPlayingMessageId(msg.id),
                          onEnd: () => setPlayingMessageId(null),
                          onError: (err) => {
                            setPlayingMessageId(null);
                            setAudioNotice(err);
                          },
                          onNotice: (notice) => setAudioNotice(notice),
                        });
                        if (res.isPermissionBlocked) {
                          setAudioNotice(res.note || 'Audio playback blocked by browser permissions. Click directly to allow sound.');
                        } else if (res.warningNotice && res.isTransliteratedFallback) {
                          setAudioNotice(res.warningNotice);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all mt-1 ${
                        playingMessageId === msg.id
                          ? 'bg-red-600 text-white border-red-700 animate-pulse'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                      aria-label="Listen to message audio"
                    >
                      {playingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>{strings.actions.listening || 'Playing...'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>{strings.actions.listen}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Saathi Coach gentle correction / tip */}
                  {msg.correction && (
                    <div className="bg-amber-100/70 border border-amber-300 text-amber-950 rounded-2xl p-3 text-xs flex items-start gap-2 shadow-xs">
                      <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-900">Saathi Coach:</strong> {msg.correction}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex items-start justify-end gap-2.5 ml-auto max-w-[85%]">
                <div className="bg-red-600 text-white rounded-3xl rounded-tr-sm p-4 text-sm font-semibold shadow-xs">
                  {msg.text}
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            );
          }
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold pl-11">
            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
            <span>{currentScenario.roleplayRole} is replying in Kannada...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Replies */}
      {latestAiMessage?.quickReplies && latestAiMessage.quickReplies.length > 0 && !isLoading && (
        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{strings.actions.quickReplies} (One-tap test)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {latestAiMessage.quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(reply)}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-semibold text-left transition-all active:scale-98"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Message Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-300 shadow-sm focus-within:ring-2 focus-within:ring-red-500"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder={`Type in Kannada, English, or ${langConfig.name} (e.g. 'How much?' or 'Bill kodtira?')...`}
          className="flex-1 px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{strings.actions.sendMessage}</span>
        </button>
      </form>
    </div>
  );
};
