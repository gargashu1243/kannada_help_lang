import React, { useState, useEffect } from 'react';
import {
  SCENARIOS,
  ScenarioItem,
  generateQuizForScenario,
  QuizQuestion,
} from '../utils/kannada';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import { speakKannada } from '../utils/speech';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface QuizViewProps {
  currentLanguage: string;
  initialScenarioId?: string;
  onRecordScore: (scenarioId: string, score: number, total: number) => void;
  onStartRoleplay: (scenarioId: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  currentLanguage,
  initialScenarioId = 'hospital',
  onRecordScore,
  onStartRoleplay,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);

  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;

  // Initialize questions whenever scenario or language changes
  useEffect(() => {
    const qList = generateQuizForScenario(selectedScenarioId, currentLanguage, 5);
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setIsQuizComplete(false);
  }, [selectedScenarioId, currentLanguage]);

  const currentQ = questions[currentIndex];
  const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQ) return;

    setSelectedOptionIndex(index);
    setIsAnswered(true);

    const isCorrect = currentQ.options[index].isCorrect;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Play pronunciation of selected option
    speakKannada(currentQ.options[index].kannada);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      setIsQuizComplete(true);
      onRecordScore(selectedScenarioId, score, questions.length);
    }
  };

  const handleRestart = () => {
    const qList = generateQuizForScenario(selectedScenarioId, currentLanguage, 5);
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setIsQuizComplete(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Scenario Selector Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-stone-500 whitespace-nowrap pl-2">
          Scenario:
        </span>
        {SCENARIOS.map(s => {
          const isSelected = s.id === selectedScenarioId;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScenarioId(s.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Main Quiz Card */}
      {!isQuizComplete && currentQ ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header & Progress */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-stone-400 font-medium">• {activeScenario.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1 text-red-600">
                <Flame className="w-4 h-4 fill-red-600" />
                <span>{streak} Streak</span>
              </div>
              <div className="text-stone-700">
                {strings.labels.score}: {score}/{currentIndex + (isAnswered ? 1 : 0)}
              </div>
            </div>
          </div>

          {/* Prompt Section: Meaning in Learner's Language */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80">
            <div className="text-xs text-stone-500 font-bold uppercase mb-1">
              Choose the correct Kannada phrase for:
            </div>
            <div
              className={`text-xl sm:text-2xl font-black text-stone-900 ${langConfig.fontClass}`}
            >
              "{currentQ.promptMeaning}"
            </div>
            <div className="text-xs text-stone-500 mt-1 italic">
              Context: {currentQ.context}
            </div>
          </div>

          {/* 4 Kannada Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              let btnClass = 'border-stone-200 hover:border-amber-400 hover:bg-amber-50/20';

              if (isAnswered) {
                if (option.isCorrect) {
                  btnClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20';
                } else if (isSelected && !option.isCorrect) {
                  btnClass = 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20';
                } else {
                  btnClass = 'border-stone-200 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${btnClass}`}
                >
                  <div className="flex-1 pr-3">
                    <div className="text-xl sm:text-2xl font-bold font-kannada text-stone-900">
                      {option.kannada}
                    </div>
                    <div className="text-xs font-semibold text-stone-500 mt-1 flex items-center gap-2">
                      <span className="text-[11px] px-1 rounded bg-stone-100 font-sans">
                        {langConfig.scriptName}:
                      </span>
                      <span className={langConfig.fontClass}>{option.translit}</span>
                    </div>
                  </div>

                  {/* Feedback indicator */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakKannada(option.kannada);
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      title="Listen"
                      aria-label={`Pronounce ${option.kannada}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {isAnswered && option.isCorrect && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                    )}
                    {isAnswered && isSelected && !option.isCorrect && (
                      <XCircle className="w-6 h-6 text-red-600 fill-red-100" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {isAnswered && (
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="text-sm font-bold">
                {currentQ.options[selectedOptionIndex || 0]?.isCorrect ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {strings.labels.correct}
                  </span>
                ) : (
                  <span className="text-red-700 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> {strings.labels.incorrect} {currentQ.correctKannada}
                  </span>
                )}
              </div>

              <button
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>
                  {currentIndex === questions.length - 1
                    ? strings.actions.seeResults
                    : strings.actions.nextQuestion}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Completed Results Card */
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-lg text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Quiz Completed!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
              {activeScenario.title}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              You scored <strong className="text-red-700 text-lg">{score}</strong> out of{' '}
              <strong>{questions.length}</strong>!
            </p>
          </div>

          {/* Performance commentary */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs sm:text-sm text-stone-700 max-w-md mx-auto">
            {score === questions.length
              ? '🌟 Perfect score! You are fully prepared to navigate this situation in Kannada!'
              : score >= 3
              ? '👏 Great job! A few more practice sessions and you will speak like a local!'
              : '💪 Good start! Review the phrase cards and try again.'}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-xs text-stone-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{strings.actions.restartQuiz}</span>
            </button>

            <button
              onClick={() => onStartRoleplay(selectedScenarioId)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Practice in AI Roleplay ({activeScenario.roleplayRole}) →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
