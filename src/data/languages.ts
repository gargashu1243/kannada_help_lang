export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  scriptName: string;
  fontClass: string;
  isVerified: boolean;
  statusBadge?: string;
  sampleGreeting: string;
  regionHint: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    scriptName: 'Devanagari',
    fontClass: 'font-devanagari',
    isVerified: true,
    sampleGreeting: 'नमस्ते! कन्नड़ सीखें',
    regionHint: 'उत्तर एवं मध्य भारत (North & Central India)',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    scriptName: 'Devanagari',
    fontClass: 'font-devanagari',
    isVerified: false,
    statusBadge: 'Beta',
    sampleGreeting: 'नमस्कार! कन्नड शिका',
    regionHint: 'महाराष्ट्र (Maharashtra)',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    scriptName: 'Bengali',
    fontClass: 'font-bengali',
    isVerified: false,
    statusBadge: 'Beta',
    sampleGreeting: 'নমস্কার! কন্নড় শিখুন',
    regionHint: 'পশ্চিমবঙ্গ ও ত্রিপুরা (Bengal & Tripura)',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    scriptName: 'Telugu',
    fontClass: 'font-telugu',
    isVerified: false,
    statusBadge: 'Beta',
    sampleGreeting: 'నమస్కారం! కన్నడ నేర్చుకోండి',
    regionHint: 'ఆంధ్రప్రదేశ్ & తెలంగాణ (AP & Telangana)',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    scriptName: 'Tamil',
    fontClass: 'font-tamil',
    isVerified: false,
    statusBadge: 'Beta',
    sampleGreeting: 'வணக்கம்! கன்னடம் கற்கலாம்',
    regionHint: 'தமிழ்நாடு (Tamil Nadu)',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    scriptName: 'Latin',
    fontClass: 'font-sans',
    isVerified: false,
    statusBadge: 'Beta',
    sampleGreeting: 'Hello! Learn Kannada',
    regionHint: 'All-India Lingua Franca',
  },
];

export function getLanguageConfig(langCode: string): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find(l => l.code === langCode) ||
    SUPPORTED_LANGUAGES[0]
  );
}

export interface UiTranslations {
  appTitle: string;
  appTagline: string;
  panIndiaBanner: string;
  verifiedFooter: string;
  tabs: {
    scenarios: string;
    quiz: string;
    roleplay: string;
    bridge: string;
    progress: string;
  };
  actions: {
    listen: string;
    listening: string;
    practiceQuiz: string;
    startRoleplay: string;
    exploreBridge: string;
    changeLanguage: string;
    searchPhrases: string;
    allScenarios: string;
    showTranslit: string;
    hideTranslit: string;
    slowAudio: string;
    normalAudio: string;
    askCustomPhrase: string;
    generateBridge: string;
    restartQuiz: string;
    nextQuestion: string;
    seeResults: string;
    sendMessage: string;
    quickReplies: string;
    demoTour: string;
  };
  labels: {
    transliteration: string;
    meaning: string;
    context: string;
    score: string;
    correct: string;
    incorrect: string;
    streak: string;
    completed: string;
    badges: string;
    aiTutorTip: string;
    ttsNotice: string;
    verifiedLabel: string;
    betaNotice: string;
  };
}

export const UI_STRINGS: Record<string, UiTranslations> = {
  hi: {
    appTitle: 'कन्नड़ साथी (Kannada Saathi)',
    appTagline: 'अपनी मातृभाषा के माध्यम से व्यावहारिक कन्नड़ सीखें',
    panIndiaBanner: 'भारत में 22 आधिकारिक भाषाएँ हैं। अपनी भाषा के माध्यम से कन्नड़ सीखें।',
    verifiedFooter: 'Phrases verified by native Kannada speakers (कन्नड़ भाषा विशेषज्ञों द्वारा सत्यापित)',
    tabs: {
      scenarios: 'दैनिक परिस्थितियाँ',
      quiz: 'त्वरित क्विज़',
      roleplay: 'एआई रोलप्ले संवाद',
      bridge: 'भाषा सेतु (समान शब्द)',
      progress: 'मेरी प्रगति',
    },
    actions: {
      listen: 'सुनें',
      listening: 'बोल रहा है...',
      practiceQuiz: 'क्विज़ हल करें',
      startRoleplay: 'संवाद शुरू करें',
      exploreBridge: 'समान शब्द देखें',
      changeLanguage: 'भाषा बदलें',
      searchPhrases: 'वाक्यांश खोजें...',
      allScenarios: 'सभी परिस्थितियाँ',
      showTranslit: 'उच्चारण दिखाएं',
      hideTranslit: 'उच्चारण छिपाएं',
      slowAudio: 'धीमी आवाज़',
      normalAudio: 'सामान्य गति',
      askCustomPhrase: 'नया वाक्य पूछें',
      generateBridge: 'और समान शब्द खोजें',
      restartQuiz: 'पुनः प्रयास करें',
      nextQuestion: 'अगला प्रश्न',
      seeResults: 'परिणाम देखें',
      sendMessage: 'संदेश भेजें',
      quickReplies: 'त्वरित उत्तर सुझाव',
      demoTour: 'जज डेमो टूर',
    },
    labels: {
      transliteration: 'उच्चारण (देवनागरी में)',
      meaning: 'अर्थ (हिंदी में)',
      context: 'कब और कैसे बोलें',
      score: 'स्कोर',
      correct: 'बिल्कुल सही! शाबाश',
      incorrect: 'गलत उत्तर! सही उत्तर यह है:',
      streak: 'लगातार सही',
      completed: 'पूर्ण',
      badges: 'उपलब्धियां',
      aiTutorTip: 'साथी गाइड टिप',
      ttsNotice: 'कन्नड़ वॉइस उपलब्ध है। यदि ऑडियो न चले तो नीचे उच्चारण लिपि पढ़ें।',
      verifiedLabel: 'सत्यापित (Verified)',
      betaNotice: 'यह भाषा बीटा में है, एआई अनुवाद सक्रिय है।',
    },
  },
  mr: {
    appTitle: 'कन्नड साथी (Kannada Saathi)',
    appTagline: 'तुमच्या मातृभाषेतून व्यावहारिक कन्नड शिका',
    panIndiaBanner: 'भारतात 22 अधिकृत भाषा आहेत. तुमच्या स्वतःच्या भाषेतून कन्नड शिका.',
    verifiedFooter: 'Phrases verified by native Kannada speakers (कन्नड भाषा तज्ञांद्वारे पडताळणी)',
    tabs: {
      scenarios: 'दैनंदिन प्रसंग',
      quiz: 'सराव प्रश्नमंजुषा',
      roleplay: 'एआय रोलप्ले संभाषण',
      bridge: 'भाषा सेतू (समान शब्द)',
      progress: 'माझी प्रगती',
    },
    actions: {
      listen: 'ऐका',
      listening: 'उच्चारत आहे...',
      practiceQuiz: 'क्विझ सोडवा',
      startRoleplay: 'संभाषण सुरू करा',
      exploreBridge: 'समान शब्द पहा',
      changeLanguage: 'भाषा बदला',
      searchPhrases: 'वाक्य शोधा...',
      allScenarios: 'सर्व प्रसंग',
      showTranslit: 'उच्चार दाखवा',
      hideTranslit: 'उच्चार लपवा',
      slowAudio: 'हळू गती',
      normalAudio: 'सामान्य गती',
      askCustomPhrase: 'नवीन वाक्य विचारा',
      generateBridge: 'अधिक समान शब्द शोधा',
      restartQuiz: 'पुन्हा प्रयत्न करा',
      nextQuestion: 'पुढील प्रश्न',
      seeResults: 'निकाल पहा',
      sendMessage: 'संदेश पाठवा',
      quickReplies: 'त्वरित उत्तर पर्याय',
      demoTour: 'जज डेमो टूर',
    },
    labels: {
      transliteration: 'उच्चार (मराठीत)',
      meaning: 'अर्थ (मराठीत)',
      context: 'कधी आणि कसे वापरावे',
      score: 'गुण',
      correct: 'अगदी बरोबर! छान',
      incorrect: 'चूक उत्तर! बरोबर उत्तर खालीलप्रमाणे आहे:',
      streak: 'सलग बरोबर',
      completed: 'पूर्ण',
      badges: 'यशस्वी पदके',
      aiTutorTip: 'साथी सल्ला',
      ttsNotice: 'कन्नड ऑडिओ उपलब्ध. आवाज न आल्यास देवनागरी उच्चार वाचा.',
      verifiedLabel: 'सत्यापित (Verified)',
      betaNotice: 'ही भाषा बीटा आवृत्तीत आहे.',
    },
  },
  bn: {
    appTitle: 'কন্নড় সাথী (Kannada Saathi)',
    appTagline: 'আপনার মাতৃভাষার মাধ্যমে ব্যবহারিক কন্নড় শিখুন',
    panIndiaBanner: 'ভারতে ২২টি সরকারি ভাষা রয়েছে। নিজের মাতৃভাষার মাধ্যমে কন্নড় শিখুন।',
    verifiedFooter: 'Phrases verified by native Kannada speakers',
    tabs: {
      scenarios: 'দৈনন্দিন পরিস্থিতি',
      quiz: 'কুইজ অনুশীলন',
      roleplay: 'এআই রোলপ্লে কথোপকথন',
      bridge: 'ভাষা সেতু (মিলযুক্ত শব্দ)',
      progress: 'আমার অগ্রগতি',
    },
    actions: {
      listen: 'শুনুন',
      listening: 'বলা হচ্ছে...',
      practiceQuiz: 'কুইজ শুরু করুন',
      startRoleplay: 'কথোপকথন শুরু করুন',
      exploreBridge: 'মিলযুক্ত শব্দ দেখুন',
      changeLanguage: 'ভাষা পরিবর্তন করুন',
      searchPhrases: 'বাক্যাংশ খুঁজুন...',
      allScenarios: 'সব পরিস্থিতি',
      showTranslit: 'উচ্চারণ দেখুন',
      hideTranslit: 'উচ্চারণ লুকান',
      slowAudio: 'ধীর গতি',
      normalAudio: 'স্বাভাবিক গতি',
      askCustomPhrase: 'নতুন বাক্য জিজ্ঞাসা করুন',
      generateBridge: 'আরো শব্দ খুঁজুন',
      restartQuiz: 'আবার চেষ্টা করুন',
      nextQuestion: 'পরবর্তী প্রশ্ন',
      seeResults: 'ফলাফল দেখুন',
      sendMessage: 'বার্তা পাঠান',
      quickReplies: 'দ্রুত উত্তরের বিকল্প',
      demoTour: 'বিচারক ডেমো ট্যুর',
    },
    labels: {
      transliteration: 'উচ্চারণ (বাংলা লিপিতে)',
      meaning: 'অর্থ (বাংলায়)',
      context: 'ব্যবহারের প্রেক্ষাপট',
      score: 'স্কোর',
      correct: 'একদম সঠিক! দারুণ',
      incorrect: 'ভুল উত্তর! সঠিক উত্তরটি হল:',
      streak: 'ধারাবাহিক সঠিক',
      completed: 'সম্পূর্ণ',
      badges: 'অর্জনসমূহ',
      aiTutorTip: 'সাথী টিপস',
      ttsNotice: 'কন্নড় উচ্চারণ অডিও সক্ষম। ডিভাইসে ভয়েস না থাকলে বাংলা উচ্চারণ লিপি পড়ুন।',
      verifiedLabel: 'যাচাইকৃত (Verified)',
      betaNotice: 'এই ভাষাটি বিটাতে রয়েছে (AI চালিত)',
    },
  },
  te: {
    appTitle: 'కన్నడ సాథి (Kannada Saathi)',
    appTagline: 'మీ మాతృభాష ద్వారా సులభంగా కన్నడ నేర్చుకోండి',
    panIndiaBanner: 'భారతదేశంలో 22 అధికారిక భాషలు ఉన్నాయి. మీ స్వంత భాష ద్వారా కన్నడ నేర్చుకోండి.',
    verifiedFooter: 'Phrases verified by native Kannada speakers',
    tabs: {
      scenarios: 'రోజువారీ పరిస్థితులు',
      quiz: 'క్విజ్ సాధన',
      roleplay: 'AI రోల్‌ప్లే సంభాషణ',
      bridge: 'భాషా వారధి (సారూప్య పదాలు)',
      progress: 'నా పురోగతి',
    },
    actions: {
      listen: 'వినండి',
      listening: 'చెబుతోంది...',
      practiceQuiz: 'క్విజ్ ప్రారంభించండి',
      startRoleplay: 'సంభాషణ చేయండి',
      exploreBridge: 'సారూప్య పదాలు చూడండి',
      changeLanguage: 'భాష మార్చండి',
      searchPhrases: 'వాక్యాలు వెతకండి...',
      allScenarios: 'అన్ని రంగాలు',
      showTranslit: 'ఉచ్చారణ చూపించు',
      hideTranslit: 'ఉచ్చారణ దాచు',
      slowAudio: 'నెమ్మదిగా',
      normalAudio: 'సాధారణం',
      askCustomPhrase: 'కొత్త వాక్యం అడగండి',
      generateBridge: 'మరిన్ని పదాలు పొందండి',
      restartQuiz: 'మళ్ళీ ప్రయత్నించండి',
      nextQuestion: 'తదుపరి ప్రశ్న',
      seeResults: 'ఫలితాలు చూడండి',
      sendMessage: 'సందేశం పంపండి',
      quickReplies: 'త్వరిత ప్రత్యుత్తరాలు',
      demoTour: 'జడ్జ్ డెమో టూర్',
    },
    labels: {
      transliteration: 'ఉచ్చారణ (తెలుగు లిపిలో)',
      meaning: 'అర్థం (తెలుగులో)',
      context: 'ఎప్పుడు ఎలా ఉపయోగించాలి',
      score: 'స్కోర్',
      correct: 'చక్కగా చెప్పారు! కరెక్ట్',
      incorrect: 'సరికాని సమాధానం! సరైనది:',
      streak: 'వరుస విజయాలు',
      completed: 'పూర్తయింది',
      badges: 'పతకాలు',
      aiTutorTip: 'సాథి సలహా',
      ttsNotice: 'కన్నడ ఆడియో అందుబాటులో ఉంది. వాయిస్ లేకపోతే తెలుగు లిపి చూడండి.',
      verifiedLabel: 'ధృవీకరించబడింది (Verified)',
      betaNotice: 'ఈ భాష బీటాలో ఉంది (AI ఆధారితం).',
    },
  },
  ta: {
    appTitle: 'கன்னட சாதி (Kannada Saathi)',
    appTagline: 'உங்கள் தாய்மொழி வழியே கன்னடம் பேசுங்கள்',
    panIndiaBanner: 'இந்தியாவில் 22 அலுவல் மொழிகள் உள்ளன. உங்கள் தாய்மொழியில் கன்னடம் கற்போம்.',
    verifiedFooter: 'Phrases verified by native Kannada speakers',
    tabs: {
      scenarios: 'அன்றாட சூழல்கள்',
      quiz: 'பயிற்சி வினாடி வினா',
      roleplay: 'AI உரையாடல் பயிற்சி',
      bridge: 'மொழி பாலம் (ஒரே வேர்ச் சொற்கள்)',
      progress: 'என் முன்னேற்றம்',
    },
    actions: {
      listen: 'கேளுங்கள்',
      listening: 'பேசுகிறது...',
      practiceQuiz: 'வினாடி வினா தொடங்கு',
      startRoleplay: 'உரையாடலைத் தொடங்கு',
      exploreBridge: 'ஒத்த சொற்களைக் காண்க',
      changeLanguage: 'மொழி மாற்று',
      searchPhrases: 'சொற்றொடர்களைத் தேடு...',
      allScenarios: 'அனைத்து சூழல்கள்',
      showTranslit: 'ஒலிபெயர்ப்பு காட்டு',
      hideTranslit: 'ஒலிபெயர்ப்பு மறை',
      slowAudio: 'மெதுவாக',
      normalAudio: 'சாதாரண வேகம்',
      askCustomPhrase: 'புதிய வாக்கியம் கேட்க',
      generateBridge: 'கூடுதல் சொற்கள் பெறு',
      restartQuiz: 'மீண்டும் முயற்சி செய்',
      nextQuestion: 'அடுத்த கேள்வி',
      seeResults: 'முடிவுகள் காண்க',
      sendMessage: 'செய்தி அனுப்பு',
      quickReplies: 'விரைவு பதில்கள்',
      demoTour: 'நடுவர் செயல்முறை சுற்றுலா',
    },
    labels: {
      transliteration: 'உச்சரிப்பு (தமிழ் எழுத்தில்)',
      meaning: 'பொருள் (தமிழில்)',
      context: 'எப்போது எப்படி பேச வேண்டும்',
      score: 'மதிப்பெண்',
      correct: 'மிகச் சரி! அருமை',
      incorrect: 'தவறான பதில்! சரியான பதில்:',
      streak: 'தொடர் வெற்றிகள்',
      completed: 'முடிந்தது',
      badges: 'சாதனைப் பதக்கங்கள்',
      aiTutorTip: 'சாதி குறிப்பு',
      ttsNotice: 'கன்னட குரல் ஒலிவடிவம் கிடைக்கிறது. இல்லையெனில் தமிழ் உச்சரிப்பைப் படியுங்கள்.',
      verifiedLabel: 'சரிபார்க்கப்பட்டது (Verified)',
      betaNotice: 'இந்த மொழி பீட்டா நிலையில் உள்ளது.',
    },
  },
  en: {
    appTitle: 'Kannada Saathi',
    appTagline: 'Learn practical Kannada for everyday life in Bengaluru & Karnataka',
    panIndiaBanner: 'India has 22 official languages. Learn Kannada through your own.',
    verifiedFooter: 'Phrases verified by native Kannada speakers',
    tabs: {
      scenarios: 'Daily Scenarios',
      quiz: 'Quick Quiz',
      roleplay: 'AI Roleplay Chat',
      bridge: 'Native Language Bridge',
      progress: 'My Progress',
    },
    actions: {
      listen: 'Listen',
      listening: 'Speaking...',
      practiceQuiz: 'Practice Quiz',
      startRoleplay: 'Start Roleplay',
      exploreBridge: 'Explore Cognates',
      changeLanguage: 'Change Language',
      searchPhrases: 'Search phrases or words...',
      allScenarios: 'All Scenarios',
      showTranslit: 'Show Pronunciation',
      hideTranslit: 'Hide Pronunciation',
      slowAudio: 'Slow Audio',
      normalAudio: 'Normal Speed',
      askCustomPhrase: 'Ask How to Say Anything',
      generateBridge: 'Generate More Cognates',
      restartQuiz: 'Try Again',
      nextQuestion: 'Next Question',
      seeResults: 'See Results',
      sendMessage: 'Send Message',
      quickReplies: 'Suggested Quick Replies',
      demoTour: 'Judges Demo Tour',
    },
    labels: {
      transliteration: 'Phonetic Pronunciation',
      meaning: 'English Meaning',
      context: 'When to use this',
      score: 'Score',
      correct: 'Correct! Spot on',
      incorrect: 'Not quite! The correct phrase is:',
      streak: 'Current Streak',
      completed: 'Completed',
      badges: 'Badges Earned',
      aiTutorTip: 'Saathi Tip',
      ttsNotice: 'Kannada voice synthesis active. If unavailable on your device, follow the phonetic guide.',
      verifiedLabel: 'Verified',
      betaNotice: 'English mode active.',
    },
  },
};

export interface BridgeWord {
  kannadaWord: string;
  kannadaTranslit: string;
  nativeWord: string;
  meaning: string;
  connectionType: string;
  explanation: string;
  exampleSentence: string;
}

export const VERIFIED_BRIDGE_WORDS: Record<string, BridgeWord[]> = {
  hi: [
    {
      kannadaWord: 'ನಮಸ್ಕಾರ (Namaskara)',
      kannadaTranslit: 'नमस्कार (Namaskara)',
      nativeWord: 'नमस्कार (Namaskar)',
      meaning: 'Greeting / Hello / Respectful bow',
      connectionType: 'Sanskrit Tatsama Cognate',
      explanation: 'Identical Sanskrit root. In Kannada, simply round off with an "-a" at the end.',
      exampleSentence: 'ಎಲ್ಲರಿಗೂ ನಮಸ್ಕಾರ (सबको नमस्कार - Hello everyone)',
    },
    {
      kannadaWord: 'ಸಮಯ (Samaya)',
      kannadaTranslit: 'समय (Samaya)',
      nativeWord: 'समय (Samay)',
      meaning: 'Time',
      connectionType: 'Sanskrit Tatsama Cognate',
      explanation: 'Exactly like Hindi "समय", just pronounced with full "-a" ending.',
      exampleSentence: 'ಈಗ ಸಮಯ ಎಷ್ಟು? (अभी समय कितना हुआ? - What is the time now?)',
    },
    {
      kannadaWord: 'ವಿದ್ಯಾರ್ಥಿ (Vidyarthi)',
      kannadaTranslit: 'विद्यार्थी (Vidyarthi)',
      nativeWord: 'विद्यार्थी (Vidyarthi)',
      meaning: 'Student',
      connectionType: 'Sanskrit Shared Term',
      explanation: '100% identical meaning and spelling across both languages.',
      exampleSentence: 'ನಾನು ಕಾಲೇಜು ವಿದ್ಯಾರ್ಥಿ (मैं कॉलेज विद्यार्थी हूँ - I am a college student)',
    },
    {
      kannadaWord: 'ಚಿಕಿತ್ಸೆ (Chikitse)',
      kannadaTranslit: 'चिकित्से (Chikitse)',
      nativeWord: 'चिकित्सा (Chikitsa)',
      meaning: 'Medical Treatment / Care',
      connectionType: 'Sanskrit Cognate',
      explanation: 'Derived from Sanskrit "चिकित्सा", familiar to any Hindi speaker in hospital clinics.',
      exampleSentence: 'ಚಿಕಿತ್ಸೆ ಶುರುವಾಗಿದೆ (चिकित्सा शुरू हो गई है - Treatment has begun)',
    },
    {
      kannadaWord: 'ಸಹಾಯ (Sahaaya)',
      kannadaTranslit: 'सहाय (Sahaaya)',
      nativeWord: 'सहायता / सहाय (Sahayata / Sahay)',
      meaning: 'Help / Assistance',
      connectionType: 'Sanskrit Cognate',
      explanation: 'Asking for help uses the familiar root: "ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡಿ" (थोड़ी सहायता कीजिये).',
      exampleSentence: 'ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡ್ತೀರಾ? (क्या आप थोड़ी सहायता करेंगे? - Could you help a bit?)',
    },
    {
      kannadaWord: 'ಶಾಂತಿ (Shaanti)',
      kannadaTranslit: 'शान्ति (Shanti)',
      nativeWord: 'शान्ति (Shanti)',
      meaning: 'Peace / Calm',
      connectionType: 'Sanskrit Cognate',
      explanation: 'Commonly used in everyday conversation and locality names (e.g. Shantinagar).',
      exampleSentence: 'ಇಲ್ಲಿ ತುಂಬಾ ಶಾಂತಿ ಇದೆ (यहाँ बहुत शान्ति है - It is very peaceful here)',
    },
    {
      kannadaWord: 'ಮಿತ್ರ (Mitra)',
      kannadaTranslit: 'मित्र (Mitra)',
      nativeWord: 'मित्र (Mitra)',
      meaning: 'Friend',
      connectionType: 'Sanskrit Shared Term',
      explanation: 'Used for companion or friend across both languages.',
      exampleSentence: 'ಅವನು ನನ್ನ ಮಿತ್ರ (वह मेरा मित्र है - He is my friend)',
    },
    {
      kannadaWord: 'ಭೋಜನ (Bhojana)',
      kannadaTranslit: 'भोजन (Bhojana)',
      nativeWord: 'भोजन (Bhojan)',
      meaning: 'Meal / Feast',
      connectionType: 'Sanskrit Cognate',
      explanation: 'Formal term for lunch/dinner, often seen on Bengaluru restaurant boards (ಉತ್ತಮ ಭೋಜನ).',
      exampleSentence: 'ಭೋಜನ ರೆಡಿ ಇದೆ (भोजन तैयार है - Meal is ready)',
    },
  ],
  mr: [
    {
      kannadaWord: 'ನಮಸ್ಕಾರ (Namaskara)',
      kannadaTranslit: 'नमस्कार (Namaskara)',
      nativeWord: 'नमस्कार (Namaskar)',
      meaning: 'Greeting / Hello',
      connectionType: 'Sanskrit Tatsama Cognate',
      explanation: 'Exact same greeting across Maharashtra and Karnataka borders.',
      exampleSentence: 'ಎಲ್ಲರಿಗೂ ನಮಸ್ಕಾರ (सर्वांना नमस्कार - Hello everyone)',
    },
    {
      kannadaWord: 'ರಸ್ತೆ (Raste)',
      kannadaTranslit: 'रस्ते (Raste)',
      nativeWord: 'रस्ता / रस्ते (Rasta / Raste)',
      meaning: 'Road / Street',
      connectionType: 'Shared Linguistic Borrowing',
      explanation: 'Both Marathi and Kannada use "Rasta/Raste" for roads and paths!',
      exampleSentence: 'ಈ ರಸ್ತೆ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತೆ? (हा रस्ता कुठे जातो? - Where does this road go?)',
    },
    {
      kannadaWord: 'ದಿನ (Dina)',
      kannadaTranslit: 'दिन (Dina)',
      nativeWord: 'दिवस / दिन (Divas / Din)',
      meaning: 'Day',
      connectionType: 'Sanskrit Root',
      explanation: '"Dina" in Kannada matches "Din" in Marathi and Marathi calendars.',
      exampleSentence: 'ಇವತ್ತು ಒಳ್ಳೆಯ ದಿನ (आज चांगला दिवस आहे - Today is a good day)',
    },
    {
      kannadaWord: 'ಪುಸ್ತಕ (Pustaka)',
      kannadaTranslit: 'पुस्तक (Pustaka)',
      nativeWord: 'पुस्तक (Pustak)',
      meaning: 'Book',
      connectionType: 'Sanskrit Tatsama',
      explanation: 'Identical word used for books and study material.',
      exampleSentence: 'ಆ ಪುಸ್ತಕ ಕೊಡಿ (ते पुस्तक द्या - Give that book)',
    },
  ],
  bn: [
    {
      kannadaWord: 'ನಮಸ್ಕಾರ (Namaskara)',
      kannadaTranslit: 'নমস্কার (Namaskara)',
      nativeWord: 'নমস্কার (Nomoshkar)',
      meaning: 'Greeting',
      connectionType: 'Sanskrit Tatsama',
      explanation: 'Bengalis will instantly feel at home: both use Namaskar as the supreme respectful greeting.',
      exampleSentence: 'ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ? (নমস্কার, কেমন আছেন? - Hello, how are you?)',
    },
    {
      kannadaWord: 'ಜಲ / ನೀರು (Jala)',
      kannadaTranslit: 'জল (Jala)',
      nativeWord: 'জল (Jol)',
      meaning: 'Water',
      connectionType: 'Sanskrit Root',
      explanation: 'While informal Kannada uses Neeru, formal signs and boards across Karnataka use "Jala" (জল).',
      exampleSentence: 'ಕುಡಿಯುವ ಜಲ (পানীয় জল - Drinking water)',
    },
    {
      kannadaWord: 'ಸಮಸ್ಯೆ (Samasye)',
      kannadaTranslit: 'সমস্যে (Samasye)',
      nativeWord: 'সমস্যা (Shomossha)',
      meaning: 'Problem / Issue',
      connectionType: 'Sanskrit Cognate',
      explanation: 'Identical root: "Enu samasye?" means "কী সমস্যা?" (What is the problem?).',
      exampleSentence: 'ಏನು ಸಮಸ್ಯೆ? (কী সমস্যা? - What is the problem?)',
    },
  ],
  te: [
    {
      kannadaWord: 'ನೀರು (Neeru)',
      kannadaTranslit: 'నీరు (Neeru)',
      nativeWord: 'నీళ్లు (Neellu)',
      meaning: 'Water',
      connectionType: 'Dravidian Sister Root',
      explanation: 'Kannada and Telugu share the proto-Dravidian root for water: Neeru / Neellu.',
      exampleSentence: 'ಸ್ವಲ್ಪ ನೀರು ಕೊಡಿ (కొంచెం నీళ్లు ఇవ్వండి - Please give some water)',
    },
    {
      kannadaWord: 'ಮನೆ (Mane)',
      kannadaTranslit: 'మనె (Mane)',
      nativeWord: 'మనే / ఇల్లు (Mane)',
      meaning: 'House / Home',
      connectionType: 'Shared Dravidian Word',
      explanation: '"Mane" is common to Telugu and Kannada cultural vocabulary.',
      exampleSentence: 'ನಮ್ಮ ಮನೆ ಹತ್ತಿರ (మా ఇంటి దగ్గర - Near our house)',
    },
    {
      kannadaWord: 'ಹಾಲು (Haalu)',
      kannadaTranslit: 'హాలు (Haalu)',
      nativeWord: 'పాలు (Paalu)',
      meaning: 'Milk',
      connectionType: 'P-to-H Phonetic Shift',
      explanation: 'Kannada shifted historic Dravidian "P" sound to "H": Telugu Paalu = Kannada Haalu!',
      exampleSentence: 'ಬಿಸಿ ಹಾಲು ಕೊಡಿ (వేడి పాలు ఇవ్వండి - Give hot milk)',
    },
    {
      kannadaWord: 'ಬನ್ನಿ (Banni)',
      kannadaTranslit: 'రండి / బన్ని (Banni)',
      nativeWord: 'రండి / రా (Randi / Raa)',
      meaning: 'Please come',
      connectionType: 'Grammatical Imperative',
      explanation: 'Baa (Come singular) -> Banni (Come plural/respectful).',
      exampleSentence: 'ಒಳಗೆ ಬನ್ನಿ (లోపలికి రండి - Please come inside)',
    },
  ],
  ta: [
    {
      kannadaWord: 'ನೀರು (Neeru)',
      kannadaTranslit: 'நீர் (Neeru)',
      nativeWord: 'நீர் / தண்ணீர் (Neer / Thanneer)',
      meaning: 'Water',
      connectionType: 'Shared Classical Dravidian Root',
      explanation: 'Identical to pure Tamil "நீர்" (Neer).',
      exampleSentence: 'ನೀರು ಬೇಕು (நீர் வேண்டும் - I want water)',
    },
    {
      kannadaWord: 'ಹಾಲು (Haalu)',
      kannadaTranslit: 'ஹாலு (Haalu)',
      nativeWord: 'பால் (Paal)',
      meaning: 'Milk',
      connectionType: 'Proto-Dravidian Sound Shift',
      explanation: 'Tamil "Paal" corresponds directly to Kannada "Haalu" via the classic P -> H transition.',
      exampleSentence: 'ಒಂದು ಲೋಟ ಹಾಲು (ஒரு டம்ளர் பால் - One glass of milk)',
    },
    {
      kannadaWord: 'ಬೆಳಕು (Belaku)',
      kannadaTranslit: 'பெளகு (Belaku)',
      nativeWord: 'வெளிச்சம் / விளக்கு (Velicham / Vilakku)',
      meaning: 'Light / Illumination',
      connectionType: 'Dravidian Root',
      explanation: 'Shared ancient root for brilliance and lighting.',
      exampleSentence: 'ಇಲ್ಲಿ ಬೆಳಕು ಚೆನ್ನಾಗಿದೆ (இங்கு வெளிச்சம் நன்றாக உள்ளது - Light is good here)',
    },
    {
      kannadaWord: 'ಕೊಡಿ (Kodi)',
      kannadaTranslit: 'கொடி (Kodi)',
      nativeWord: 'கொடுங்க (Kodunga)',
      meaning: 'Please give',
      connectionType: 'Shared Verb Root (Kodu)',
      explanation: 'Both languages share the exact verb root "Kodu" (to give).',
      exampleSentence: 'ಒಂದು ಕೆಜಿ ಕೊಡಿ (ஒரு கிலோ கொடுங்க - Please give one kg)',
    },
  ],
  en: [
    {
      kannadaWord: 'ನಮಸ್ಕಾರ (Namaskara)',
      kannadaTranslit: 'Namaskara',
      nativeWord: 'Hello / Greetings',
      meaning: 'Universal Indian formal greeting',
      connectionType: 'Cultural Anchor',
      explanation: 'Fold hands and say "Namaskara" to any elder, shopkeeper, or neighbour.',
      exampleSentence: 'ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ? (Hello, how are you?)',
    },
    {
      kannadaWord: 'ಧನ್ಯವಾದಗಳು (Dhanyavaadagalu)',
      kannadaTranslit: 'Dhanyavaadagalu',
      nativeWord: 'Thank you very much',
      meaning: 'Expressing gratitude',
      connectionType: 'Polite Conversational Tool',
      explanation: 'Use whenever a driver returns change or someone helps with directions.',
      exampleSentence: 'ತುಂಬಾ ಧನ್ಯವಾದಗಳು (Thank you very much)',
    },
  ],
};
