import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { LanguageModal } from './components/LanguageModal';
import { ScenarioList } from './components/ScenarioList';
import { PhraseLearner } from './components/PhraseLearner';
import { QuizView } from './components/QuizView';
import { RoleplayChat } from './components/RoleplayChat';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { NativeBridgeView } from './components/NativeBridgeView';
import { ProgressView } from './components/ProgressView';
import { DemoTourModal } from './components/DemoTourModal';
import { AudioTranscriberModal } from './components/AudioTranscriberModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  SCENARIOS,
  BASE_PHRASES,
  ScenarioItem,
  getStoredLanguage,
  saveStoredLanguage,
  loadUserProgress,
  saveUserProgress,
  evaluateBadges,
  UserProgress,
} from './utils/kannada';
import { getLanguageConfig, UI_STRINGS } from './data/languages';
import { speakKannada } from './utils/speech';
import { Cloud, CloudCheck, Sparkles, ShieldCheck } from 'lucide-react';

function KannadaSaathiApp() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('hi');
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);
  const [activeQuizScenarioId, setActiveQuizScenarioId] = useState<string>('hospital');
  const [activeRoleplayScenarioId, setActiveRoleplayScenarioId] = useState<string>('hospital');

  const [progress, setProgress] = useState<UserProgress>(loadUserProgress());
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);
  const [demoTourStep, setDemoTourStep] = useState<number>(0);
  const [isGlobalTranscribeOpen, setIsGlobalTranscribeOpen] = useState<boolean>(false);

  const { user, syncProgressToFirestore, loadProgressFromFirestore } = useAuth();

  // Initialize stored language and autostart
  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored) {
      setCurrentLanguage(stored);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setCurrentLanguage('hi');
        saveStoredLanguage('hi');
      } else {
        setIsFirstLaunch(true);
        setIsLangModalOpen(true);
      }
    }
  }, []);

  // When user logs in, load cloud progress if available
  useEffect(() => {
    if (user) {
      loadProgressFromFirestore().then((cloudProgress) => {
        if (cloudProgress) {
          setProgress(cloudProgress);
          saveUserProgress(cloudProgress);
        } else {
          // Sync current local progress up to Firestore
          syncProgressToFirestore(progress, currentLanguage);
        }
      });
    }
  }, [user]);

  // Update badges whenever progress changes and sync to Firestore
  useEffect(() => {
    const badges = evaluateBadges(progress);
    if (badges.length !== progress.badges.length) {
      const updated = { ...progress, badges };
      setProgress(updated);
      saveUserProgress(updated);
      if (user) syncProgressToFirestore(updated, currentLanguage);
    } else if (user) {
      syncProgressToFirestore(progress, currentLanguage);
    }
  }, [progress.learnedPhraseIds, progress.completedScenarios, progress.quizScores, progress.roleplayCompleted]);

  const handleSelectLanguage = (code: string) => {
    setCurrentLanguage(code);
    saveStoredLanguage(code);
    setIsFirstLaunch(false);
    setIsLangModalOpen(false);
    if (user) syncProgressToFirestore(progress, code);
  };

  const handleSelectScenario = (scenario: ScenarioItem) => {
    setSelectedScenario(scenario);
    setActiveTab('scenarios');
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
  };

  const handleStartQuiz = (scenarioId: string) => {
    setActiveQuizScenarioId(scenarioId);
    setSelectedScenario(null);
    setActiveTab('quiz');
  };

  const handleStartRoleplay = (scenarioId: string) => {
    setActiveRoleplayScenarioId(scenarioId);
    setSelectedScenario(null);
    setActiveTab('roleplay');
  };

  const handleToggleLearnedPhrase = (phraseId: string) => {
    const isCurrentlyLearned = progress.learnedPhraseIds.includes(phraseId);
    const updatedIds = isCurrentlyLearned
      ? progress.learnedPhraseIds.filter((id) => id !== phraseId)
      : [...progress.learnedPhraseIds, phraseId];

    const phrase = BASE_PHRASES.find((p) => p.id === phraseId);
    let completedScenarios = [...progress.completedScenarios];
    if (phrase) {
      const scenarioAllPhrases = BASE_PHRASES.filter((p) => p.scenarioId === phrase.scenarioId);
      const allLearned = scenarioAllPhrases.every((p) => updatedIds.includes(p.id));
      if (allLearned && !completedScenarios.includes(phrase.scenarioId)) {
        completedScenarios.push(phrase.scenarioId);
      }
    }

    const updatedProgress: UserProgress = {
      ...progress,
      learnedPhraseIds: updatedIds,
      completedScenarios,
    };
    setProgress(updatedProgress);
    saveUserProgress(updatedProgress);
    if (user) syncProgressToFirestore(updatedProgress, currentLanguage);
  };

  const handleRecordQuizScore = (scenarioId: string, score: number, total: number) => {
    const updated: UserProgress = {
      ...progress,
      quizScores: {
        ...progress.quizScores,
        [scenarioId]: {
          score,
          total,
          completedAt: new Date().toISOString(),
        },
      },
    };
    setProgress(updated);
    saveUserProgress(updated);
    if (user) syncProgressToFirestore(updated, currentLanguage);
  };

  const handleRecordRoleplay = (scenarioId: string) => {
    if (!progress.roleplayCompleted.includes(scenarioId)) {
      const updated: UserProgress = {
        ...progress,
        roleplayCompleted: [...progress.roleplayCompleted, scenarioId],
      };
      setProgress(updated);
      saveUserProgress(updated);
      if (user) syncProgressToFirestore(updated, currentLanguage);
    }
  };

  const handleResetProgress = () => {
    const blank: UserProgress = {
      learnedPhraseIds: [],
      completedScenarios: [],
      quizScores: {},
      roleplayCompleted: [],
      badges: [],
    };
    setProgress(blank);
    saveUserProgress(blank);
    if (user) syncProgressToFirestore(blank, currentLanguage);
  };

  // Hackathon Judges Demo Flow Execution
  const handleExecuteDemoStep = (stepNumber: number) => {
    setDemoTourStep(stepNumber - 1);

    switch (stepNumber) {
      case 1:
        handleSelectLanguage('hi');
        break;
      case 2:
        const hospitalScenario = SCENARIOS.find((s) => s.id === 'hospital') || SCENARIOS[2];
        setSelectedScenario(hospitalScenario);
        setActiveTab('scenarios');
        break;
      case 3:
        const p1 = 'hospital_1';
        const p2 = 'hospital_2';
        const p3 = 'hospital_3';
        const updatedLearned = Array.from(new Set([...progress.learnedPhraseIds, p1, p2, p3]));
        setProgress((prev) => {
          const u = { ...prev, learnedPhraseIds: updatedLearned };
          saveUserProgress(u);
          if (user) syncProgressToFirestore(u, currentLanguage);
          return u;
        });
        speakKannada('ಡಾಕ್ಟರ್ ಯಾವಾಗ ಸಿಗ್ತಾರೆ?');
        break;
      case 4:
        handleStartQuiz('hospital');
        break;
      case 5:
        handleStartRoleplay('hospital');
        break;
      case 6:
        const nextLang = currentLanguage === 'hi' ? 'mr' : currentLanguage === 'mr' ? 'bn' : 'hi';
        handleSelectLanguage(nextLang);
        break;
      case 7:
        setSelectedScenario(null);
        setActiveTab('progress');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-red-700 selection:text-white">
      {/* Header with Navigation and Auth */}
      <Header
        currentLanguage={currentLanguage}
        onOpenLanguageModal={() => setIsLangModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedScenario(null);
          setActiveTab(tab);
        }}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
        onOpenTranscribe={() => setIsGlobalTranscribeOpen(true)}
        badgeCount={progress.badges.length}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'scenarios' && (
          <>
            {selectedScenario ? (
              <PhraseLearner
                scenario={selectedScenario}
                currentLanguage={currentLanguage}
                onBack={handleBackToScenarios}
                onStartQuiz={handleStartQuiz}
                onStartRoleplay={handleStartRoleplay}
                learnedPhraseIds={progress.learnedPhraseIds}
                onToggleLearned={handleToggleLearnedPhrase}
              />
            ) : (
              <ScenarioList
                currentLanguage={currentLanguage}
                onSelectScenario={handleSelectScenario}
                onStartQuiz={handleStartQuiz}
                onStartRoleplay={handleStartRoleplay}
                learnedPhraseIds={progress.learnedPhraseIds}
              />
            )}
          </>
        )}

        {activeTab === 'quiz' && (
          <QuizView
            currentLanguage={currentLanguage}
            initialScenarioId={activeQuizScenarioId}
            onRecordScore={handleRecordQuizScore}
            onStartRoleplay={handleStartRoleplay}
          />
        )}

        {activeTab === 'roleplay' && (
          <RoleplayChat
            currentLanguage={currentLanguage}
            initialScenarioId={activeRoleplayScenarioId}
            onRecordRoleplayCompleted={handleRecordRoleplay}
          />
        )}

        {activeTab === 'chatbot' && (
          <GeminiChatbotView currentLanguage={currentLanguage} />
        )}

        {activeTab === 'bridge' && (
          <NativeBridgeView currentLanguage={currentLanguage} />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            currentLanguage={currentLanguage}
            progress={progress}
            onResetProgress={handleResetProgress}
            onNavigateToScenario={(scenarioId) => {
              const sc = SCENARIOS.find((s) => s.id === scenarioId);
              if (sc) handleSelectScenario(sc);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-stone-700">
              Phrases verified by native Kannada speakers
            </span>
          </div>

          <div className="flex items-center gap-3 text-stone-400">
            {user && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CloudCheck className="w-4 h-4 text-emerald-600" /> Cloud Sync Active
              </span>
            )}
            <span>•</span>
            <span>Kannada Technology Challenge 2026</span>
            <span>•</span>
            <span className="font-kannada font-bold text-red-700">ಕನ್ನಡ ಸಾಥಿ</span>
          </div>
        </div>
      </footer>

      {/* Language Selection Modal */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        selectedLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        isInitialSetup={isFirstLaunch}
      />

      {/* Judges Demo Tour Stepper Modal */}
      <DemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        currentStepIndex={demoTourStep}
        onExecuteStep={handleExecuteDemoStep}
      />

      {/* Global Voice Input Transcribe Modal */}
      <AudioTranscriberModal
        isOpen={isGlobalTranscribeOpen}
        onClose={() => setIsGlobalTranscribeOpen(false)}
        onTranscriptionComplete={(text) => {
          // Open chatbot with transcribed query
          setActiveTab('chatbot');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KannadaSaathiApp />
    </AuthProvider>
  );
}
