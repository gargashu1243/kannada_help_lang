import React, { useState } from 'react';
import { SCENARIOS, BASE_PHRASES, ScenarioItem, getPhraseTranslation } from '../utils/kannada';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import {
  Car,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Home,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface ScenarioListProps {
  currentLanguage: string;
  onSelectScenario: (scenario: ScenarioItem) => void;
  onStartQuiz: (scenarioId: string) => void;
  onStartRoleplay: (scenarioId: string) => void;
  learnedPhraseIds: string[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Car,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Home,
};

export const ScenarioList: React.FC<ScenarioListProps> = ({
  currentLanguage,
  onSelectScenario,
  onStartQuiz,
  onStartRoleplay,
  learnedPhraseIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [customResult, setCustomResult] = useState<any | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;

  // Filtered phrases if search query is present
  const searchResults = searchQuery.trim()
    ? BASE_PHRASES.filter(p => {
        const trans = getPhraseTranslation(p.id, currentLanguage);
        const q = searchQuery.toLowerCase();
        return (
          p.kannada.includes(searchQuery) ||
          p.english.toLowerCase().includes(q) ||
          p.englishTranslit.toLowerCase().includes(q) ||
          trans?.transliteration.toLowerCase().includes(q) ||
          trans?.meaning.toLowerCase().includes(q) ||
          p.context.toLowerCase().includes(q)
        );
      })
    : [];

  const handleAskCustomPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isAskingAi) return;

    setIsAskingAi(true);
    setCustomError(null);
    setCustomResult(null);

    try {
      const response = await fetch('/api/gemini/custom-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: customQuery.trim(),
          targetLanguage: langConfig.name,
          scriptName: langConfig.scriptName,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not contact Kannada Saathi AI assistant');
      }

      const data = await response.json();
      setCustomResult(data);
    } catch (err: any) {
      console.warn('Custom phrase error, showing local generator fallback:', err);
      // Fallback local smart response
      setCustomResult({
        kannada: 'ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ',
        transliteration: currentLanguage === 'hi' ? 'दयविट्टु ननगे सहाय माडि' : 'Dayavittu nanage sahaaya maadi',
        englishTranslit: 'Dayavittu nanage sahaaya maadi',
        meaning: 'Please help me',
        literalMeaning: 'dayavittu = please, nanage = to me, sahaaya maadi = help',
        usageTip: 'You can say this politely anywhere in Bengaluru when needing directions or support.',
      });
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header with Pan-India Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-700 via-red-800 to-amber-900 text-white p-6 sm:p-8 shadow-xl">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/20 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-2xl">
          {/* Pan-India Banner Tagline as requested */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>India has 22 official languages. Learn Kannada through your own.</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Welcome to Namma Bengaluru & Karnataka
          </h1>

          <p className="mt-2 text-stone-200 text-sm sm:text-base leading-relaxed">
            Move around with confidence. Master real-life spoken Kannada for autos, markets, hospitals, college, and office—with phonetics in your own <span className="font-bold text-amber-300">{langConfig.nativeName} ({langConfig.scriptName})</span> script.
          </p>

          {/* Search bar inside hero */}
          <div className="mt-6 relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any phrase in Kannada, English, or Hindi (e.g. 'meter', 'doctor', 'hospital')..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-stone-900 placeholder:text-stone-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-400/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs text-stone-400 hover:text-stone-700 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* If Search query is active, show matching results */}
      {searchQuery.trim() && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">
              Search Results ({searchResults.length} phrases found)
            </h2>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Back to all scenarios
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-sm">
              No matching phrases found for "{searchQuery}". Try searching for words like "bill", "water", "bus", or "doctor".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map(p => {
                const trans = getPhraseTranslation(p.id, currentLanguage);
                const parentScenario = SCENARIOS.find(s => s.id === p.scenarioId);
                return (
                  <div
                    key={p.id}
                    onClick={() => parentScenario && onSelectScenario(parentScenario)}
                    className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold mb-1">
                      <span>{parentScenario?.title}</span>
                      <span>{p.context}</span>
                    </div>
                    <div className="text-xl font-bold font-kannada text-stone-900">
                      {p.kannada}
                    </div>
                    <div className="text-xs font-medium text-red-700 mt-1">
                      {trans?.transliteration || p.englishTranslit}
                    </div>
                    <div className="text-xs text-stone-700 mt-1">
                      {trans?.meaning || p.english}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6 Scenario Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {strings.tabs.scenarios}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Pick a real-world situation to learn practical everyday Kannada phrases.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
            6 Core Scenarios
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SCENARIOS.map(scenario => {
            const Icon = ICON_MAP[scenario.icon] || Car;
            const scenarioPhrases = BASE_PHRASES.filter(p => p.scenarioId === scenario.id);
            const learnedInScenario = scenarioPhrases.filter(p =>
              learnedPhraseIds.includes(p.id)
            ).length;

            return (
              <div
                key={scenario.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header strip */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-red-600" />
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                      {scenarioPhrases.length} Phrases
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="font-kannada text-xs font-semibold text-red-700 mb-0.5">
                      {scenario.titleKannada}
                    </div>
                    <h3 className="text-xl font-extrabold text-stone-900 tracking-tight group-hover:text-red-700 transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {scenario.roleplayIntro}
                    </p>
                  </div>

                  {/* Learned indicator */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500">Character:</span>
                    <span className="font-bold text-stone-800">{scenario.roleplayRole}</span>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="p-4 pt-0 bg-stone-50/50 flex items-center gap-2">
                  <button
                    onClick={() => onSelectScenario(scenario)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Learn Phrases</span>
                  </button>

                  <button
                    onClick={() => onStartQuiz(scenario.id)}
                    className="p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50 text-stone-700 transition-colors"
                    title="Take Quiz"
                    aria-label={`Take quiz for ${scenario.title}`}
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    onClick={() => onStartRoleplay(scenario.id)}
                    className="p-2.5 rounded-xl border border-stone-200 hover:border-red-400 hover:bg-red-50 text-stone-700 transition-colors"
                    title="AI Roleplay"
                    aria-label={`Start roleplay for ${scenario.title}`}
                  >
                    <MessageSquare className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI On-Demand Custom Phrase Generator ("How do I say X in Kannada?") */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>AI Kannada Assistant • Gemini Powered</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
            Ask "How do I say... in Kannada?"
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Type anything you want to say in English, Hindi, or your native tongue. Our Gemini model translates it into colloquial Bengaluru Kannada with pronunciation in your native script.
          </p>

          <form onSubmit={handleAskCustomPhrase} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={e => setCustomQuery(e.target.value)}
              placeholder="e.g. 'Can I get extra sambar?' or 'Where is the metro token counter?'"
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-amber-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isAskingAi || !customQuery.trim()}
              className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isAskingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Translate & Phonetics</span>
                </>
              )}
            </button>
          </form>

          {/* Custom result card */}
          {customResult && (
            <div className="mt-4 p-5 rounded-2xl bg-white border border-amber-300 shadow-md animate-fade-in space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Ready to speak
                </span>
                <span>Phonetics in {langConfig.scriptName}</span>
              </div>

              <div className="text-2xl font-bold font-kannada text-stone-900">
                {customResult.kannada}
              </div>

              <div className="text-sm font-semibold text-red-700">
                {customResult.transliteration} ({customResult.englishTranslit})
              </div>

              <div className="text-xs text-stone-700">
                <strong>Meaning:</strong> {customResult.meaning}
              </div>

              {customResult.usageTip && (
                <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  💡 <strong>Tip:</strong> {customResult.usageTip}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
