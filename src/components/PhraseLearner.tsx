import React, { useState } from 'react';
import {
  ScenarioItem,
  BASE_PHRASES,
  PhraseItem,
  getPhraseTranslation,
} from '../utils/kannada';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import { speakKannada, stopSpeech } from '../utils/speech';
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Info,
  Clock,
  Gauge,
} from 'lucide-react';

interface PhraseLearnerProps {
  scenario: ScenarioItem;
  currentLanguage: string;
  onBack: () => void;
  onStartQuiz: (scenarioId: string) => void;
  onStartRoleplay: (scenarioId: string) => void;
  learnedPhraseIds: string[];
  onToggleLearned: (phraseId: string) => void;
}

export const PhraseLearner: React.FC<PhraseLearnerProps> = ({
  scenario,
  currentLanguage,
  onBack,
  onStartQuiz,
  onStartRoleplay,
  learnedPhraseIds,
  onToggleLearned,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isSlowMode, setIsSlowMode] = useState<boolean>(false);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [showTransliteration, setShowTransliteration] = useState<boolean>(true);

  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;

  const scenarioPhrases = BASE_PHRASES.filter(p => p.scenarioId === scenario.id);
  const learnedCount = scenarioPhrases.filter(p => learnedPhraseIds.includes(p.id)).length;
  const progressPercent = Math.round((learnedCount / scenarioPhrases.length) * 100);

  const handlePlayAudio = async (phrase: PhraseItem) => {
    if (playingId === phrase.id) {
      stopSpeech();
      setPlayingId(null);
      return;
    }

    setPlayingId(phrase.id);
    const result = await speakKannada(phrase.kannada, {
      slow: isSlowMode,
      onStart: () => setPlayingId(phrase.id),
      onEnd: () => setPlayingId(null),
      onError: (err) => {
        setPlayingId(null);
        setTtsNotice(err);
      },
      onNotice: (notice) => {
        setTtsNotice(notice);
      },
    });

    if (result.isPermissionBlocked) {
      setTtsNotice(
        result.note || 'Audio playback was blocked by browser permissions. Please click directly to allow sound.'
      );
    } else if (result.warningNotice && result.isTransliteratedFallback) {
      // Show user-friendly OS fallback notification
      setTtsNotice(result.warningNotice);
    } else if (result.success) {
      // Clear notice if succeeded with native voice or Gemini TTS
      if (!result.warningNotice) {
        setTtsNotice(null);
      }
    } else if (!result.hasVoice) {
      setTtsNotice(
        result.note || 'Audio is currently unavailable on this device. Transliteration guide is displayed below to pronounce accurately!'
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Scenario Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm relative overflow-hidden">
        {/* Accent background wash */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all"
            aria-label="Back to all scenarios"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{strings.actions.allScenarios}</span>
          </button>

          {/* Quick actions for Quiz and Roleplay */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartQuiz(scenario.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{strings.actions.practiceQuiz}</span>
            </button>
            <button
              onClick={() => onStartRoleplay(scenario.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{strings.actions.startRoleplay}</span>
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold mb-2">
            <span>{scenario.badge}</span>
            <span>•</span>
            <span className="font-kannada">{scenario.titleKannada}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {scenario.title}
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            {scenario.roleplayIntro}
          </p>

          {/* Progress Bar */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">Scenario Mastery:</span>
              <span className="font-semibold text-red-700">
                {learnedCount} of {scenarioPhrases.length} phrases learned
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-36 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-bold text-stone-600">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control bar: Transliteration toggle & Speech rate */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransliteration(!showTransliteration)}
            className={`px-3 py-1.5 rounded-xl border font-semibold transition-all ${
              showTransliteration
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {showTransliteration ? strings.actions.hideTranslit : strings.actions.showTranslit}
          </button>

          <button
            onClick={() => setIsSlowMode(!isSlowMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all ${
              isSlowMode
                ? 'bg-red-100 border-red-300 text-red-900'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isSlowMode ? strings.actions.slowAudio : strings.actions.normalAudio}</span>
          </button>
        </div>

        <div className="text-stone-500">
          Showing in: <strong className="text-stone-800">{langConfig.nativeName}</strong> ({langConfig.scriptName} Script)
        </div>
      </div>

      {/* TTS Notice if needed */}
      {ttsNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{ttsNotice}</span>
          </div>
          <button
            onClick={() => setTtsNotice(null)}
            className="text-amber-800 hover:text-amber-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Phrase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarioPhrases.map((phrase, index) => {
          const trans = getPhraseTranslation(phrase.id, currentLanguage);
          const isLearned = learnedPhraseIds.includes(phrase.id);
          const isPlaying = playingId === phrase.id;

          const transliteration = trans?.transliteration || phrase.englishTranslit;
          const meaning = trans?.meaning || phrase.english;

          return (
            <div
              key={phrase.id}
              className={`p-5 rounded-3xl border-2 transition-all relative flex flex-col justify-between group ${
                isLearned
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-white border-stone-200/90 hover:border-amber-400 hover:shadow-md'
              }`}
            >
              {/* Phrase Card Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[11px] font-bold text-stone-400">
                  #{index + 1} • {phrase.context}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Mark learned button */}
                  <button
                    onClick={() => onToggleLearned(phrase.id)}
                    className={`p-1.5 rounded-xl transition-all ${
                      isLearned
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-stone-300 hover:text-emerald-500 hover:bg-stone-100'
                    }`}
                    title={isLearned ? 'Marked as learned' : 'Mark as learned'}
                    aria-label={`Mark phrase ${phrase.kannada} as learned`}
                  >
                    <CheckCircle2 className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>

              {/* 1. Large Kannada Script */}
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold font-kannada text-stone-900 leading-snug tracking-wide">
                  {phrase.kannada}
                </div>

                {/* 2. Transliteration in Learner's Script */}
                {showTransliteration && (
                  <div className="mt-2 text-sm sm:text-base font-semibold text-red-700 flex items-center gap-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-sans">
                      {langConfig.scriptName}:
                    </span>
                    <span className={langConfig.fontClass}>{transliteration}</span>
                  </div>
                )}

                {/* 3. Meaning in Learner's Language */}
                <div className="mt-2.5 pt-2.5 border-t border-stone-100">
                  <div className="text-xs text-stone-500 font-medium">{strings.labels.meaning}:</div>
                  <div className={`text-base font-bold text-stone-800 mt-0.5 ${langConfig.fontClass}`}>
                    {meaning}
                  </div>
                  {/* English reference gloss if viewing Indic */}
                  {currentLanguage !== 'en' && (
                    <div className="text-xs text-stone-400 mt-0.5 italic">
                      ({phrase.english})
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom: Listen Button */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => handlePlayAudio(phrase)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                    isPlaying
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                  aria-label={`Listen to Kannada pronunciation for ${phrase.kannada}`}
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>{strings.actions.listening}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-amber-700" />
                      <span>{strings.actions.listen} (kn-IN)</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-stone-400 font-medium">
                  {phrase.englishTranslit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scenario Completion Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-700 via-amber-600 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Ready to test yourself?</h3>
          <p className="text-xs text-amber-100 mt-0.5">
            Take a 5-question multiple choice quiz or practice real conversation with AI!
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onStartQuiz(scenario.id)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-amber-50 shadow-md transition-colors"
          >
            {strings.actions.practiceQuiz}
          </button>
          <button
            onClick={() => onStartRoleplay(scenario.id)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-black shadow-md transition-colors"
          >
            {strings.actions.startRoleplay}
          </button>
        </div>
      </div>
    </div>
  );
};
