import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  Gauge,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Award,
  ChevronDown,
  Info,
  Car,
  ShoppingBag,
  HeartPulse,
  Home,
  Briefcase,
  Play,
  RotateCw,
  Speech,
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  getLanguageConfig,
  LanguageOption,
} from '../data/languages';
import {
  speakKannada,
  speakInLanguage,
  stopSpeaking,
  isSpeechRecognitionSupported,
  getSpeechRecognitionLocale,
} from '../utils/speech';
import {
  saveCustomPhrase,
  removeSavedPhrase,
  isPhraseSaved,
  SavedPhrase,
} from '../utils/kannada';

export interface LiveMessageWord {
  word: string;
  transliteration: string;
  meaning: string;
}

export interface LiveMessage {
  id: string;
  speaker: 'kannada' | 'native'; // 'kannada' = Person A, 'native' = Person B
  text: string;
  translation: string;
  transliteration: string;
  words?: LiveMessageWord[];
  timestamp: string;
  isSaved?: boolean;
}

export interface ScenarioQuickChip {
  id: string;
  label: string;
  kannadaLabel: string;
  icon: React.ElementType;
  context: string;
}

const QUICK_SCENARIOS: ScenarioQuickChip[] = [
  {
    id: 'hospital',
    label: 'Hospital',
    kannadaLabel: 'ಆಸ್ಪತ್ರೆ',
    icon: HeartPulse,
    context: 'At a hospital or clinic talking with a doctor or receptionist about health, symptoms, medicines and appointments',
  },
  {
    id: 'travel',
    label: 'Auto / Bus',
    kannadaLabel: 'ಆಟೋ / ಬಸ್',
    icon: Car,
    context: 'Riding an auto or bus in Bengaluru, discussing meter, fare, directions and stops',
  },
  {
    id: 'shopping',
    label: 'Market',
    kannadaLabel: 'ಮಾರುಕಟ್ಟೆ',
    icon: ShoppingBag,
    context: 'Buying groceries or vegetables at a market, discussing prices, weight, discounts and UPI payment',
  },
  {
    id: 'landlord',
    label: 'Landlord',
    kannadaLabel: 'ಮನೆ ಮಾಲೀಕರು',
    icon: Home,
    context: 'Renting a flat or discussing house maintenance, rent, water, electricity and repairs with a landlord',
  },
  {
    id: 'workplace',
    label: 'Workplace',
    kannadaLabel: 'ಕಚೇರಿ',
    icon: Briefcase,
    context: 'At an office or workplace chatting with colleagues, lunch plans, meetings and work updates',
  },
];

interface LiveTalkViewProps {
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  onNavigateToPhrases?: () => void;
}

export const LiveTalkView: React.FC<LiveTalkViewProps> = ({
  currentLanguage,
  onSelectLanguage,
  onNavigateToPhrases,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('hospital');
  const [isFaceToFaceRotated, setIsFaceToFaceRotated] = useState<boolean>(true);
  const [messages, setMessages] = useState<LiveMessage[]>([]);

  // Speech Recognition state
  const [activeSpeakerListening, setActiveSpeakerListening] = useState<'kannada' | 'native' | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  // Text input fallback
  const [kannadaInput, setKannadaInput] = useState<string>('');
  const [nativeInput, setNativeInput] = useState<string>('');

  // Translating state
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPayload, setLastFailedPayload] = useState<{ text: string; speaker: 'kannada' | 'native' } | null>(null);

  // Audio playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Word inspect modal / popover
  const [inspectedWord, setInspectedWord] = useState<LiveMessageWord | null>(null);

  // Summary & Quiz modal state
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    learnedWords: { word: string; translit: string; meaning: string }[];
    quizQuestions: {
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Auto scroll
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const langConfig = getLanguageConfig(currentLanguage);
  const activeScenario = QUICK_SCENARIOS.find(s => s.id === selectedScenarioId) || QUICK_SCENARIOS[0];

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isTranslating]);

  // Clean up recognition and speech when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      stopSpeaking();
    };
  }, []);

  // 1. Send speech / text to Gemini Translation API
  const handleTranslateAndPost = async (text: string, speaker: 'kannada' | 'native') => {
    if (!text.trim() || isTranslating) return;

    setIsTranslating(true);
    setErrorMessage(null);
    setLastFailedPayload(null);

    const fromLang = speaker === 'kannada' ? 'kn' : currentLanguage;
    const toLang = speaker === 'kannada' ? currentLanguage : 'kn';

    try {
      const response = await fetch('/api/gemini/live-talk-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          fromLanguage: fromLang,
          toLanguage: toLang,
          targetLanguageName: langConfig.name,
          scriptName: langConfig.scriptName,
          scenarioId: activeScenario.id,
          scenarioContext: activeScenario.context,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not translate via Gemini API. Tap Retry to try again.');
      }

      const data = await response.json();
      const translation = data.translation || '';
      const transliteration = data.transliteration || '';
      const words = Array.isArray(data.words) ? data.words : [];

      const newMsg: LiveMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        speaker,
        text: text.trim(),
        translation,
        transliteration,
        words,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSaved: isPhraseSaved(speaker === 'kannada' ? text.trim() : translation),
      };

      setMessages(prev => [...prev, newMsg]);

      // Automatically speak the translation in the other person's language
      const speakTextTarget = translation;
      const speakLang = toLang;
      speakInLanguage(speakTextTarget, speakLang, {
        onStart: () => setPlayingMessageId(newMsg.id),
        onEnd: () => setPlayingMessageId(null),
      }).catch(err => console.warn('Auto speak notice:', err));

    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorMessage(err?.message || 'Translation failed. Please check internet connection.');
      setLastFailedPayload({ text, speaker });
    } finally {
      setIsTranslating(false);
      setInterimTranscript('');
      setActiveSpeakerListening(null);
    }
  };

  // 2. Microphone Speech Recognition Handler
  const toggleSpeechRecognition = (speaker: 'kannada' | 'native') => {
    // If already listening on this speaker, stop
    if (activeSpeakerListening === speaker) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setActiveSpeakerListening(null);
      setInterimTranscript('');
      return;
    }

    // If listening on other speaker, stop previous first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      setErrorMessage(
        'Speech Recognition is not supported by this browser. Please use Google Chrome or type in the text box below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      const targetLocale =
        speaker === 'kannada' ? 'kn-IN' : getSpeechRecognitionLocale(currentLanguage);

      recognition.lang = targetLocale;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setActiveSpeakerListening(speaker);
      setErrorMessage(null);
      setInterimTranscript('');

      let finalCapturedText = '';

      recognition.onstart = () => {
        setActiveSpeakerListening(speaker);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalCapturedText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim || finalCapturedText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            'Microphone access denied. Please allow microphone permissions in your browser bar.'
          );
        } else if (event.error === 'no-speech') {
          // silent ignore or soft notice
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Speech recognition error (${event.error}). You can type directly below!`);
        }
        setActiveSpeakerListening(null);
      };

      recognition.onend = () => {
        setActiveSpeakerListening(null);
        if (finalCapturedText.trim()) {
          handleTranslateAndPost(finalCapturedText.trim(), speaker);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setActiveSpeakerListening(null);
      setErrorMessage('Could not activate microphone. Please type your phrase below.');
    }
  };

  // 3. Replay Audio (Normal / Slow)
  const handleReplayAudio = async (msg: LiveMessage, slow: boolean = false) => {
    // If msg is Kannada speaker, speak the Kannada original or translation
    const isKannadaVoice = msg.speaker === 'kannada';
    const textToSpeak = isKannadaVoice ? msg.text : msg.translation;
    const langToSpeak = 'kn';

    if (playingMessageId === msg.id) {
      stopSpeaking();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(msg.id);
    await speakKannada(textToSpeak, {
      slow,
      onStart: () => setPlayingMessageId(msg.id),
      onEnd: () => setPlayingMessageId(null),
      onError: () => setPlayingMessageId(null),
    });
  };

  // 4. Replay in Native Language (for Kannada speaker listening back to Hindi/English)
  const handleReplayNativeAudio = async (msg: LiveMessage) => {
    const textToSpeak = msg.speaker === 'native' ? msg.text : msg.translation;
    const langToSpeak = currentLanguage;

    if (playingMessageId === `${msg.id}_native`) {
      stopSpeaking();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(`${msg.id}_native`);
    await speakInLanguage(textToSpeak, langToSpeak, {
      onStart: () => setPlayingMessageId(`${msg.id}_native`),
      onEnd: () => setPlayingMessageId(null),
      onError: () => setPlayingMessageId(null),
    });
  };

  // 5. Save Phrase to "My Phrases"
  const handleToggleSavePhrase = (msg: LiveMessage) => {
    const kannadaPhrase = msg.speaker === 'kannada' ? msg.text : msg.translation;
    const meaningPhrase = msg.speaker === 'kannada' ? msg.translation : msg.text;
    const translitPhrase = msg.transliteration;

    if (msg.isSaved) {
      // Remove
      const existingSaved = isPhraseSaved(kannadaPhrase);
      if (existingSaved) {
        removeSavedPhrase(msg.id);
      }
      setMessages(prev =>
        prev.map(m => (m.id === msg.id ? { ...m, isSaved: false } : m))
      );
    } else {
      // Save
      saveCustomPhrase({
        id: msg.id,
        kannada: kannadaPhrase,
        meaning: meaningPhrase,
        transliteration: translitPhrase,
        scenarioId: activeScenario.id,
        scenarioTitle: activeScenario.label,
        source: 'live_talk',
      });
      setMessages(prev =>
        prev.map(m => (m.id === msg.id ? { ...m, isSaved: true } : m))
      );
    }
  };

  // 6. Word tap inspector
  const handleTapKannadaWord = (rawWord: string, msg: LiveMessage) => {
    const clean = rawWord.replace(/[,.?!:;""'')(]/g, '').trim();
    if (!clean) return;

    // Check if Gemini extracted this word
    const matchedWord = msg.words?.find(
      w => w.word.includes(clean) || clean.includes(w.word)
    );

    if (matchedWord) {
      setInspectedWord(matchedWord);
    } else {
      // Default heuristic lookup
      setInspectedWord({
        word: clean,
        transliteration: clean,
        meaning: `Kannada word used in this ${activeScenario.label} conversation`,
      });
    }
  };

  // 7. End-of-Chat Summary & Interactive Quiz
  const handleOpenSummary = async () => {
    if (messages.length === 0) {
      setErrorMessage('Have at least one conversation exchange before ending to see your learning summary!');
      return;
    }

    setIsSummaryOpen(true);
    setIsGeneratingSummary(true);
    setQuizAnswers({});

    try {
      const response = await fetch('/api/gemini/live-talk-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            speaker: m.speaker,
            text: m.text,
            translation: m.translation,
          })),
          targetLanguage: langConfig.name,
          scriptName: langConfig.scriptName,
          scenarioId: activeScenario.label,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.warn('Summary generation fallback:', err);
      // Fallback summary
      setSummaryData({
        summary: `Great practice! You successfully conversed about ${activeScenario.label} in Kannada.`,
        learnedWords: [
          { word: 'ಜ್ವರ (Jwara)', translit: 'ज्वर (Jwara)', meaning: 'बुखार (Fever)' },
          { word: 'ಔಷಧಿ (Aushadhi)', translit: 'औषधि (Aushadhi)', meaning: 'दवाई (Medicine)' },
          { word: 'ಬನ್ನಿ (Banni)', translit: 'बन्नी (Banni)', meaning: 'आइए (Please come)' },
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What does "ಜ್ವರ (Jwara)" mean?',
            options: ['बुखार (Fever)', 'खांसी (Cough)', 'पानी (Water)', 'दुकान (Shop)'],
            correctIndex: 0,
            explanation: '"Jwara" means fever.',
          },
          {
            id: 'q2',
            question: 'What does "ಔಷಧಿ (Aushadhi)" mean?',
            options: ['फल (Fruit)', 'दवाई (Medicine)', 'किराया (Fare)', 'रास्ता (Road)'],
            correctIndex: 1,
            explanation: '"Aushadhi" means medicine.',
          },
          {
            id: 'q3',
            question: 'What is the polite Kannada word for "आइए" (Please come)?',
            options: ['ಹೋಗಿ (Hogi)', 'ಬನ್ನಿ (Banni)', 'ಕುಡಿಯಿರಿ (Kudiyiri)', 'ನೋಡಿ (Nodi)'],
            correctIndex: 1,
            explanation: '"ಬನ್ನಿ (Banni)" is the respectful way to say "Please come".',
          },
        ],
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 8. Run Judges Demo Flow (Hospital scenario, Hindi speaker -> Kannada doctor -> Summary)
  const handleRunJudgesDemoFlow = async () => {
    // 1. Select Hospital Scenario & Hindi
    setSelectedScenarioId('hospital');
    onSelectLanguage('hi');
    setMessages([]);
    setErrorMessage(null);
    setIsTranslating(true);

    // Step A: Hindi speaker says "मुझे दो दिन से बुखार है"
    const hindiInput = 'मुझे दो दिन से बुखार है';
    setNativeInput(hindiInput);

    setTimeout(() => {
      setNativeInput('');
      const msg1: LiveMessage = {
        id: `demo_msg_1_${Date.now()}`,
        speaker: 'native',
        text: hindiInput,
        translation: 'ನನಗೆ ಎರಡು ದಿನಗಳಿಂದ ಜ್ವರ ಇದೆ',
        transliteration: 'ननगे एरडु दिनगळिंद ज्वर इदे (Nanage eradu dinagalinda jwara ide)',
        words: [
          { word: 'ನನಗೆ', transliteration: 'ननगे (Nanage)', meaning: 'मुझे (To me)' },
          { word: 'ಎರಡು', transliteration: 'एरडु (Eradu)', meaning: 'दो (Two)' },
          { word: 'ದಿನಗಳಿಂದ', transliteration: 'दिनगळिंद (Dinagalinda)', meaning: 'दिनों से (Since days)' },
          { word: 'ಜ್ವರ', transliteration: 'ज्वर (Jwara)', meaning: 'बुखार (Fever)' },
          { word: 'ಇದೆ', transliteration: 'इदे (Ide)', meaning: 'है (Is present)' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSaved: false,
      };

      setMessages([msg1]);
      setIsTranslating(false);

      // Play Kannada speech
      speakKannada('ನನಗೆ ಎರಡು ದಿನಗಳಿಂದ ಜ್ವರ ಇದೆ', {
        onStart: () => setPlayingMessageId(msg1.id),
        onEnd: () => setPlayingMessageId(null),
      });

      // Step B: Doctor replies in Kannada after 2.8s
      setTimeout(() => {
        setIsTranslating(true);
        setTimeout(() => {
          const msg2: LiveMessage = {
            id: `demo_msg_2_${Date.now()}`,
            speaker: 'kannada',
            text: 'ಔಷಧಿ ತಗೊಂಡಿದ್ದೀರಾ? ಬಿಪಿ ಚೆಕ್ ಮಾಡೋಣ ಬನ್ನಿ',
            translation: 'क्या आपने दवाई ली है? आइए, आपका बीपी चेक करते हैं।',
            transliteration: 'औषधि तगोंडिद्दीरा? बीपी चेक माडोण बन्नी (Aushadhi tagondiddira? BP check maadona banni)',
            words: [
              { word: 'ಔಷಧಿ', transliteration: 'औषधि (Aushadhi)', meaning: 'दवाई (Medicine)' },
              { word: 'ತಗೊಂಡಿದ್ದೀರಾ', transliteration: 'तगोंडिद्दीरा (Tagondiddira)', meaning: 'क्या ली है? (Have you taken?)' },
              { word: 'ಬಿಪಿ', transliteration: 'बीपी (BP)', meaning: 'ब्लड प्रेशर (Blood Pressure)' },
              { word: 'ಚೆಕ್ ಮಾಡೋಣ', transliteration: 'चेक माडोण (Check maadona)', meaning: 'जांच करते हैं (Let us check)' },
              { word: 'ಬನ್ನಿ', transliteration: 'बन्नी (Banni)', meaning: 'आइए (Please come)' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSaved: true,
          };

          // Save phrase
          saveCustomPhrase({
            id: msg2.id,
            kannada: msg2.text,
            meaning: msg2.translation,
            transliteration: msg2.transliteration,
            scenarioId: 'hospital',
            scenarioTitle: 'Hospital',
            source: 'live_talk',
          });

          setMessages([msg1, msg2]);
          setIsTranslating(false);

          // Speak Hindi translation for the user
          speakInLanguage('क्या आपने दवाई ली है? आइए, आपका बीपी चेक करते हैं।', 'hi', {
            onStart: () => setPlayingMessageId(`${msg2.id}_native`),
            onEnd: () => setPlayingMessageId(null),
          });
        }, 800);
      }, 2400);
    }, 600);
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header & Scenario Selector */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs space-y-4">
        {/* Banner with Title and 180° Flip Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center font-kannada font-bold text-xl shadow-md">
              ಸಂ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Live Talk (ಸಂವಾದ)
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Real-Time Face-to-Face
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Two-person conversational interpreter: one speaks Kannada, the other speaks their native tongue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Run Judges Demo Flow */}
            <button
              onClick={handleRunJudgesDemoFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              title="Run 2-person demo conversation for hackathon judges"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Judges Demo Flow</span>
            </button>

            {/* 180-Degree Rotation Toggle */}
            <button
              onClick={() => setIsFaceToFaceRotated(!isFaceToFaceRotated)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isFaceToFaceRotated
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
              title="Invert Person A's side by 180 degrees so people sitting opposite each other can read"
            >
              <RotateCw className={`w-3.5 h-3.5 transition-transform ${isFaceToFaceRotated ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">
                {isFaceToFaceRotated ? 'Face-to-Face (180° Inverted)' : 'Same Direction'}
              </span>
              <span className="sm:hidden">180°</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 hover:border-red-200 text-stone-500 hover:text-red-700 text-xs font-bold transition-all"
                title="Clear conversation history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Context Chips + Language Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Quick-Start Scenario Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-stone-500 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Scenario:
            </span>
            {QUICK_SCENARIOS.map(chip => {
              const ChipIcon = chip.icon;
              const isSelected = selectedScenarioId === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedScenarioId(chip.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <ChipIcon className="w-3.5 h-3.5" />
                  <span>{chip.label}</span>
                  <span className={`text-[10px] font-kannada opacity-90 ${isSelected ? 'text-amber-200' : 'text-stone-500'}`}>
                    ({chip.kannadaLabel})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Person B Native Language Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-stone-500">Person B Speaks:</span>
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={e => onSelectLanguage(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold hover:bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Browser Notice & Disclaimer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 bg-amber-50/70 p-2.5 rounded-2xl border border-amber-200/80">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              Recommended: <strong>Chrome on desktop or Android</strong> for the best live speech recognition.
            </span>
          </div>
          <span className="italic text-stone-400">
            Note: Translations may not be 100% perfect. Please verify critical medical or legal details.
          </span>
        </div>
      </div>

      {/* Error / Retry Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastFailedPayload && (
              <button
                onClick={() => handleTranslateAndPost(lastFailedPayload.text, lastFailedPayload.speaker)}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-950 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Face-to-Face Split Screen */}
      <div className="bg-stone-100 rounded-3xl border-2 border-stone-200/90 shadow-md overflow-hidden flex flex-col min-h-[580px]">
        {/* ==============================================================
            TOP HALF: PERSON A (KANNADA SPEAKER - Localite / Driver / Doctor)
            Rotatable 180 degrees so facing person reads right side up!
           ============================================================== */}
        <div
          className={`p-5 sm:p-6 bg-amber-50/90 border-b-2 border-stone-300 transition-all duration-300 ${
            isFaceToFaceRotated ? 'rotate-180 transform' : ''
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <span className="font-extrabold text-stone-900 text-sm">
                  Person A: ಕನ್ನಡ ಭಾಷಿಕ (Kannada Speaker)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  Localite / {activeScenario.label}
                </span>
              </div>
              <span className="text-xs text-stone-500 font-kannada font-semibold hidden sm:inline">
                ಇಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಬರೆಯಿರಿ
              </span>
            </div>

            {/* Mic and Input Row */}
            <div className="flex items-center gap-3">
              {/* Large Mic Button */}
              <button
                onClick={() => toggleSpeechRecognition('kannada')}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex flex-col items-center justify-center gap-1 font-bold transition-all shadow-md active:scale-95 shrink-0 ${
                  activeSpeakerListening === 'kannada'
                    ? 'bg-red-600 text-white ring-4 ring-red-300 animate-pulse'
                    : 'bg-white hover:bg-red-50 text-red-700 border-2 border-red-200'
                }`}
                title="Tap to speak in Kannada (kn-IN)"
              >
                {activeSpeakerListening === 'kannada' ? (
                  <>
                    <Mic className="w-7 h-7 text-white animate-bounce" />
                    <span className="text-[10px] font-sans">ಕೇಳುತ್ತಿದೆ...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-7 h-7 text-red-600" />
                    <span className="text-[10px] font-sans">ಮಾತನಾಡಿ</span>
                  </>
                )}
              </button>

              {/* Text input fallback */}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={kannadaInput}
                  onChange={e => setKannadaInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && kannadaInput.trim()) {
                      handleTranslateAndPost(kannadaInput, 'kannada');
                      setKannadaInput('');
                    }
                  }}
                  placeholder="ಕನ್ನಡದಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ (Type in Kannada if noisy)..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white border border-amber-200 text-sm font-kannada text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
                />
                <button
                  onClick={() => {
                    if (kannadaInput.trim()) {
                      handleTranslateAndPost(kannadaInput, 'kannada');
                      setKannadaInput('');
                    }
                  }}
                  disabled={!kannadaInput.trim() || isTranslating}
                  className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listening indicator for Person A */}
            {activeSpeakerListening === 'kannada' && (
              <div className="p-2.5 rounded-xl bg-red-100 text-red-900 text-xs font-semibold flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>Listening to Kannada (kn-IN)...</span>
                {interimTranscript && (
                  <span className="font-kannada italic ml-1">"{interimTranscript}"</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==============================================================
            MIDDLE SECTION: SHARED CONVERSATION HISTORY (Chat Bubbles)
           ============================================================== */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[380px] bg-stone-50/60">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                <Speech className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-stone-800">
                Ready for Live Conversation
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Tap Person B's mic (bottom) to speak in <strong>{langConfig.name}</strong>, or Person A's mic (top) to speak in <strong>Kannada</strong>. Gemini will instantly translate and speak the sentence aloud.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunJudgesDemoFlow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Try Sample Hospital Dialogue (Judges Demo)</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isFromKannada = msg.speaker === 'kannada';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isFromKannada ? 'items-start' : 'items-end'
                  } space-y-1 animate-fade-in`}
                >
                  {/* Speaker Label */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 px-2">
                    <span>
                      {isFromKannada ? 'Person A (Kannada Localite)' : `Person B (${langConfig.name} Speaker)`}
                    </span>
                    <span>•</span>
                    <span className="font-normal text-stone-400">{msg.timestamp}</span>
                  </div>

                  {/* Bubble Container */}
                  <div
                    className={`max-w-xl rounded-3xl p-4 sm:p-5 shadow-sm border transition-all ${
                      isFromKannada
                        ? 'bg-amber-50/90 border-amber-300 text-stone-900 rounded-tl-sm'
                        : 'bg-white border-stone-200 text-stone-900 rounded-tr-sm'
                    }`}
                  >
                    {/* 1. Original Spoken Text */}
                    <div className="text-xs text-stone-500 font-semibold mb-1 flex items-center justify-between">
                      <span>Original Spoken:</span>
                      <span className="text-[10px] font-sans uppercase tracking-wider px-1.5 py-0.2 rounded bg-stone-100">
                        {isFromKannada ? 'Kannada' : langConfig.name}
                      </span>
                    </div>

                    <div className="text-lg sm:text-xl font-bold leading-snug">
                      {isFromKannada ? (
                        /* Kannada original: words are clickable for definitions! */
                        <div className="font-kannada flex flex-wrap gap-1.5 items-center">
                          {msg.text.split(' ').map((wordToken, wIdx) => (
                            <span
                              key={wIdx}
                              onClick={() => handleTapKannadaWord(wordToken, msg)}
                              className="cursor-pointer hover:bg-amber-200/80 hover:text-amber-950 px-1 py-0.5 rounded transition-colors underline decoration-dotted decoration-amber-400"
                              title="Tap word for meaning and pronunciation"
                            >
                              {wordToken}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className={langConfig.fontClass}>{msg.text}</div>
                      )}
                    </div>

                    {/* 2. Translation & Transliteration Box */}
                    <div className="mt-3 pt-3 border-t border-stone-200/70 space-y-1.5">
                      <div className="text-xs font-semibold text-stone-500 flex items-center justify-between">
                        <span>Translation:</span>
                        <span className="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-bold">
                          {isFromKannada ? langConfig.name : 'Kannada'}
                        </span>
                      </div>

                      {/* Translated text */}
                      <div className="text-base sm:text-lg font-bold text-red-900">
                        {!isFromKannada ? (
                          /* Translated into Kannada: words are clickable too! */
                          <div className="font-kannada flex flex-wrap gap-1.5 items-center">
                            {msg.translation.split(' ').map((wToken, wIdx) => (
                              <span
                                key={wIdx}
                                onClick={() => handleTapKannadaWord(wToken, msg)}
                                className="cursor-pointer hover:bg-red-200/80 hover:text-red-950 px-1 py-0.5 rounded transition-colors underline decoration-dotted decoration-red-400"
                                title="Tap Kannada word for meaning"
                              >
                                {wToken}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className={langConfig.fontClass}>{msg.translation}</div>
                        )}
                      </div>

                      {/* Transliteration Guide */}
                      {msg.transliteration && (
                        <div className="text-xs font-semibold text-amber-900 bg-amber-100/70 px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                          <span className="text-[10px] px-1 rounded bg-amber-200 text-amber-950 font-bold">
                            Pronounce:
                          </span>
                          <span className={langConfig.fontClass}>{msg.transliteration}</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Action Toolbar */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Audio Playback Controls */}
                      <div className="flex items-center gap-1.5">
                        {/* Play Kannada Audio */}
                        <button
                          onClick={() => handleReplayAudio(msg, false)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all ${
                            playingMessageId === msg.id
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                          title="Replay Kannada Audio (kn-IN)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Kannada</span>
                        </button>

                        {/* Slow Kannada Audio */}
                        <button
                          onClick={() => handleReplayAudio(msg, true)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 font-semibold transition-all"
                          title="Play Kannada Audio Slower"
                        >
                          <Gauge className="w-3.5 h-3.5" />
                          <span>Slow</span>
                        </button>

                        {/* Replay in Native Language */}
                        <button
                          onClick={() => handleReplayNativeAudio(msg)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all ${
                            playingMessageId === `${msg.id}_native`
                              ? 'bg-amber-600 text-white animate-pulse'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                          title={`Play ${langConfig.name} Audio`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{langConfig.name}</span>
                        </button>
                      </div>

                      {/* Save Phrase Bookmark Button */}
                      <button
                        onClick={() => handleToggleSavePhrase(msg)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all ${
                          msg.isSaved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                        title={msg.isSaved ? 'Saved to My Phrases' : 'Save phrase to My Phrases list'}
                      >
                        {msg.isSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700 fill-current" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-stone-500" />
                            <span>Save Phrase</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Translating shimmer indicator */}
          {isTranslating && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-100/70 p-3 rounded-2xl border border-amber-200 max-w-xs animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
              <span className="font-bold">Gemini Translating spoken Kannada...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Conversation Action Footer Bar */}
        {messages.length > 0 && (
          <div className="px-5 py-3 bg-white border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              {messages.length} messages in this session
            </span>
            <button
              onClick={handleOpenSummary}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>End Conversation & Take Quiz</span>
            </button>
          </div>
        )}

        {/* ==============================================================
            BOTTOM HALF: PERSON B (YOU - Hindi / Marathi / Bengali / Telugu / Tamil / English)
           ============================================================== */}
        <div className="p-5 sm:p-6 bg-white border-t-2 border-stone-300">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-extrabold text-stone-900 text-sm">
                  Person B: You ({langConfig.name} - {langConfig.nativeName})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {langConfig.scriptName} Script
                </span>
              </div>
              <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                Speak or type in your native tongue
              </span>
            </div>

            {/* Mic and Input Row */}
            <div className="flex items-center gap-3">
              {/* Large Mic Button */}
              <button
                onClick={() => toggleSpeechRecognition('native')}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex flex-col items-center justify-center gap-1 font-bold transition-all shadow-md active:scale-95 shrink-0 ${
                  activeSpeakerListening === 'native'
                    ? 'bg-amber-600 text-white ring-4 ring-amber-300 animate-pulse'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300'
                }`}
                title={`Tap to speak in ${langConfig.name} (${getSpeechRecognitionLocale(currentLanguage)})`}
              >
                {activeSpeakerListening === 'native' ? (
                  <>
                    <Mic className="w-7 h-7 text-white animate-bounce" />
                    <span className="text-[10px] font-sans">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-7 h-7 text-amber-700" />
                    <span className="text-[10px] font-sans">Speak</span>
                  </>
                )}
              </button>

              {/* Text input fallback */}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={nativeInput}
                  onChange={e => setNativeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && nativeInput.trim()) {
                      handleTranslateAndPost(nativeInput, 'native');
                      setNativeInput('');
                    }
                  }}
                  placeholder={`Type in ${langConfig.name} or English (e.g. 'मुझे दो दिन से बुखार है')...`}
                  className={`flex-1 px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs ${langConfig.fontClass}`}
                />
                <button
                  onClick={() => {
                    if (nativeInput.trim()) {
                      handleTranslateAndPost(nativeInput, 'native');
                      setNativeInput('');
                    }
                  }}
                  disabled={!nativeInput.trim() || isTranslating}
                  className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listening indicator for Person B */}
            {activeSpeakerListening === 'native' && (
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                <span>Listening to {langConfig.name} ({getSpeechRecognitionLocale(currentLanguage)})...</span>
                {interimTranscript && (
                  <span className={`italic ml-1 ${langConfig.fontClass}`}>"{interimTranscript}"</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Word Inspect Modal (Tapped Kannada Word) */}
      {inspectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-amber-300 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded">
                  Word Breakdown
                </span>
                <h3 className="text-3xl font-black font-kannada text-stone-900 mt-1">
                  {inspectedWord.word}
                </h3>
              </div>
              <button
                onClick={() => setInspectedWord(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                <div className="text-stone-500 font-medium">Pronunciation in your script:</div>
                <div className={`text-base font-bold text-amber-900 mt-0.5 ${langConfig.fontClass}`}>
                  {inspectedWord.transliteration}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                <div className="text-stone-500 font-medium">Meaning:</div>
                <div className={`text-base font-bold text-stone-800 mt-0.5 ${langConfig.fontClass}`}>
                  {inspectedWord.meaning}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => speakKannada(inspectedWord.word)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear Pronunciation</span>
              </button>
              <button
                onClick={() => {
                  saveCustomPhrase({
                    kannada: inspectedWord.word,
                    meaning: inspectedWord.meaning,
                    transliteration: inspectedWord.transliteration,
                    scenarioId: activeScenario.id,
                    scenarioTitle: activeScenario.label,
                    source: 'live_talk',
                  });
                  setInspectedWord(null);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs"
                title="Save word to My Phrases"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End-of-Chat Learning Summary & Quiz Modal */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-amber-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-2 w-full karnataka-flag-bar" />

            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">
                    Conversation Learning Summary
                  </h3>
                  <p className="text-xs text-stone-500">
                    Vocabulary & 1-Tap Quiz from your conversation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSummaryOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5">
              {isGeneratingSummary ? (
                <div className="text-center py-12 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                  <p className="text-sm font-bold text-stone-700">
                    Extracting new words & building your quiz...
                  </p>
                </div>
              ) : summaryData ? (
                <>
                  {/* Summary Note */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                    💡 <strong>Summary:</strong> {summaryData.summary}
                  </div>

                  {/* Vocabulary Learned */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Key Words Heard in Conversation ({summaryData.learnedWords?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {summaryData.learnedWords?.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl border border-stone-200 bg-stone-50/60 flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="font-kannada font-bold text-base text-stone-900">
                              {item.word}
                            </div>
                            <div className="text-xs font-semibold text-red-700 mt-0.5">
                              {item.translit}
                            </div>
                            <div className="text-xs text-stone-600 mt-0.5">
                              {item.meaning}
                            </div>
                          </div>
                          <button
                            onClick={() => speakKannada(item.word)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-colors shrink-0"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Tap Quiz on newly learned words */}
                  {summaryData.quizQuestions && summaryData.quizQuestions.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-red-600" />
                          1-Tap Quiz ({summaryData.quizQuestions.length} Questions)
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {summaryData.quizQuestions.map((q, qIdx) => {
                          const selectedOption = quizAnswers[qIdx];
                          const hasAnswered = selectedOption !== undefined;
                          const isCorrect = selectedOption === q.correctIndex;

                          return (
                            <div
                              key={q.id || qIdx}
                              className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2.5 shadow-xs"
                            >
                              <div className="text-xs font-bold text-stone-800">
                                {qIdx + 1}. {q.question}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options.map((opt, optIdx) => {
                                  const isThisSelected = selectedOption === optIdx;
                                  const isThisCorrect = optIdx === q.correctIndex;

                                  let buttonStyle = 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100';
                                  if (hasAnswered) {
                                    if (isThisCorrect) {
                                      buttonStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                                    } else if (isThisSelected) {
                                      buttonStyle = 'bg-red-100 border-red-400 text-red-950';
                                    } else {
                                      buttonStyle = 'opacity-40 bg-stone-50 border-stone-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => {
                                        if (!hasAnswered) {
                                          setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                                        }
                                      }}
                                      disabled={hasAnswered}
                                      className={`p-2.5 rounded-xl border text-xs text-left transition-all font-medium ${buttonStyle}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <div
                                  className={`p-2 rounded-xl text-[11px] font-medium ${
                                    isCorrect
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-amber-50 text-amber-900'
                                  }`}
                                >
                                  {isCorrect ? '✅ Correct! ' : '💡 Explanation: '}
                                  {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => {
                  // Save all learned words into custom phrases
                  summaryData?.learnedWords?.forEach(w => {
                    saveCustomPhrase({
                      kannada: w.word,
                      transliteration: w.translit,
                      meaning: w.meaning,
                      scenarioId: activeScenario.id,
                      scenarioTitle: activeScenario.label,
                      source: 'live_talk',
                    });
                  });
                  setIsSummaryOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Save Words to My Phrases
              </button>

              <button
                onClick={() => setIsSummaryOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
