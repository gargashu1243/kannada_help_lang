import React from 'react';
import { SCENARIOS, BASE_PHRASES, UserProgress } from '../utils/kannada';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import {
  Trophy,
  Award,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ProgressViewProps {
  currentLanguage: string;
  progress: UserProgress;
  onResetProgress: () => void;
  onNavigateToScenario: (scenarioId: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  currentLanguage,
  progress,
  onResetProgress,
  onNavigateToScenario,
}) => {
  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;

  const totalPhrases = BASE_PHRASES.length;
  const learnedCount = progress.learnedPhraseIds.length;
  const percentComplete = Math.round((learnedCount / totalPhrases) * 100);

  const availableBadges = [
    {
      title: 'First Steps in Kannada (ಮೊದಲ ಹೆಜ್ಜೆ)',
      desc: 'Learned at least 3 phrases with audio.',
      unlocked: learnedCount >= 3,
      icon: '🌱',
    },
    {
      title: 'Bengaluru Explorer (ಬೆಂಗಳೂರು ಯಾತ್ರಿಕ)',
      desc: 'Learned at least 10 phrases across scenarios.',
      unlocked: learnedCount >= 10,
      icon: '🛺',
    },
    {
      title: 'Scenario Master (ಪರಿಸ್ಥಿತಿ ಜಯಿಸಿದವರು)',
      desc: 'Completed all phrases in at least one scenario.',
      unlocked: progress.completedScenarios.length >= 1,
      icon: '⭐',
    },
    {
      title: 'AI Conversation Hero (ಧೈರ್ಯಶಾಲಿ ಸಂಭಾಷಕ)',
      desc: 'Conducted a full roleplay dialogue with a local AI character.',
      unlocked: progress.roleplayCompleted.length >= 1,
      icon: '💬',
    },
    {
      title: 'Quiz Champ (ಕ್ವಿಜ್ ಚಾಂಪಿಯನ್)',
      desc: 'Completed at least one scenario quiz with a passing score.',
      unlocked: Object.keys(progress.quizScores).length >= 1,
      icon: '🏆',
    },
    {
      title: 'Kannada Saathi Scholar (ಕನ್ನಡ ಸಾಥಿ ವಿದ್ವಾಂಸ)',
      desc: 'Learned 25+ phrases and mastered daily Bengaluru life.',
      unlocked: learnedCount >= 25,
      icon: '👑',
    },
  ];

  const unlockedBadgeCount = availableBadges.filter(b => b.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-stone-400 uppercase">Learned Phrases</div>
          <div className="mt-2 text-3xl font-black text-red-600">
            {learnedCount}
            <span className="text-sm font-semibold text-stone-400">/{totalPhrases}</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">{percentComplete}% overall mastery</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-stone-400 uppercase">Quizzes Passed</div>
          <div className="mt-2 text-3xl font-black text-amber-600">
            {Object.keys(progress.quizScores).length}
            <span className="text-sm font-semibold text-stone-400">/6</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Real-time feedback</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-stone-400 uppercase">Roleplays Done</div>
          <div className="mt-2 text-3xl font-black text-rose-600">
            {progress.roleplayCompleted.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Local AI characters</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-stone-400 uppercase">Badges Earned</div>
          <div className="mt-2 text-3xl font-black text-emerald-600">
            {unlockedBadgeCount}
            <span className="text-sm font-semibold text-stone-400">/{availableBadges.length}</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Milestones unlocked</div>
        </div>
      </div>

      {/* Scenario Progress Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <h2 className="text-xl font-bold text-stone-900">
          Scenario Progress & Quiz Scores
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map(scenario => {
            const scPhrases = BASE_PHRASES.filter(p => p.scenarioId === scenario.id);
            const learnedInScenario = scPhrases.filter(p =>
              progress.learnedPhraseIds.includes(p.id)
            ).length;
            const scPercent = Math.round((learnedInScenario / scPhrases.length) * 100);
            const quizScore = progress.quizScores[scenario.id];

            return (
              <div
                key={scenario.id}
                className="p-4 rounded-2xl border border-stone-200/90 hover:border-amber-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-kannada text-xs font-semibold text-red-700">
                        {scenario.titleKannada}
                      </span>
                      <h3 className="font-bold text-stone-900 text-sm">{scenario.title}</h3>
                    </div>
                    {quizScore && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Quiz: {quizScore.score}/{quizScore.total}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>
                        {learnedInScenario}/{scPhrases.length} phrases
                      </span>
                      <span className="font-bold text-stone-700">{scPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                        style={{ width: `${scPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => onNavigateToScenario(scenario.id)}
                    className="text-xs font-bold text-red-600 hover:text-red-700"
                  >
                    Open Scenario →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges and Milestones Section */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Badges & Milestones ({unlockedBadgeCount}/{availableBadges.length})</span>
          </h2>
          <button
            onClick={onResetProgress}
            className="text-xs font-semibold text-stone-400 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {availableBadges.map((badge, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                badge.unlocked
                  ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                  : 'bg-stone-50/50 border-stone-200 opacity-50 grayscale'
              }`}
            >
              <div className="text-2xl shrink-0 p-2 rounded-xl bg-white shadow-xs">
                {badge.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900 leading-snug">
                  {badge.title}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 leading-tight">
                  {badge.desc}
                </div>
                <div className="mt-2 text-[10px] font-bold">
                  {badge.unlocked ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-stone-400">Locked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
