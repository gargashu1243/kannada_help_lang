import React from 'react';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X,
  Volume2,
  HelpCircle,
  MessageSquare,
  Globe,
  Trophy,
} from 'lucide-react';

export interface DemoStep {
  number: number;
  title: string;
  actionText: string;
  description: string;
  icon: React.ElementType;
}

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStepIndex: number;
  onExecuteStep: (stepNumber: number) => void;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    number: 1,
    title: 'Choose Native Language (Hindi)',
    actionText: 'Set Language to Hindi',
    description: 'Sets Hindi as verified mother tongue. Transliteration appears in Devanagari script.',
    icon: Globe,
  },
  {
    number: 2,
    title: 'Choose "Hospital & Health"',
    actionText: 'Open Hospital Scenario',
    description: 'Navigate to real-life clinic scenario with 9 authentic medical phrases.',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Learn Phrases with Audio',
    actionText: 'Listen to 3 Phrases',
    description: 'Hear native Web Speech API (kn-IN) pronunciation and mark phrases as learned.',
    icon: Volume2,
  },
  {
    number: 4,
    title: 'Take Quick Quiz',
    actionText: 'Launch Hospital Quiz',
    description: 'Solve meaning-to-Kannada multiple choice questions with instant color feedback.',
    icon: HelpCircle,
  },
  {
    number: 5,
    title: 'AI Roleplay with Receptionist',
    actionText: 'Chat with Preeti',
    description: 'Simulate booking an appointment. AI responds in Kannada with transliteration & Saathi tip.',
    icon: MessageSquare,
  },
  {
    number: 6,
    title: 'Live Talk (Samvaad) Face-to-Face Translation',
    actionText: 'Open Live Talk Demo',
    description: 'Two-person real-time interpreter: Hindi speaker says "मुझे दो दिन से बुखार है", app speaks Kannada, doctor replies, save phrase & see quiz summary.',
    icon: Sparkles,
  },
  {
    number: 7,
    title: 'Instant Adaptability: Switch to Marathi / Bengali',
    actionText: 'Switch Language',
    description: 'Switch native language to Marathi or Bengali; watch transliterations instantly update!',
    icon: Globe,
  },
  {
    number: 8,
    title: 'Show Progress & Milestones',
    actionText: 'Open Progress Dashboard',
    description: 'View learned counts, quiz history, and unlocked Karnataka cultural badges.',
    icon: Trophy,
  },
];

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  currentStepIndex,
  onExecuteStep,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-amber-300 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="demo-tour-title"
      >
        {/* Flag Bar */}
        <div className="h-2 w-full karnataka-flag-bar" />

        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 id="demo-tour-title" className="font-bold text-stone-900 text-base">
                Judges Demo Tour
              </h3>
              <p className="text-xs text-stone-500">
                Official Hackathon Evaluation Walkthrough
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close demo tour modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {DEMO_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = currentStepIndex === idx;
            const isCompleted = currentStepIndex > idx;

            return (
              <div
                key={step.number}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'border-red-500 bg-red-50/40 shadow-xs ring-1 ring-red-400/30'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-stone-200 bg-stone-50/50 opacity-80'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-900 text-xs">{step.title}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded">
                        Current Step
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">
                    {step.description}
                  </p>

                  <button
                    onClick={() => {
                      onExecuteStep(step.number);
                    }}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isCurrent
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                    }`}
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Step {Math.min(currentStepIndex + 1, DEMO_STEPS.length)} of {DEMO_STEPS.length}
          </span>
          <button
            onClick={() => {
              const next = currentStepIndex + 1;
              if (next < DEMO_STEPS.length) {
                onExecuteStep(next + 1);
              } else {
                onClose();
              }
            }}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors"
          >
            {currentStepIndex >= DEMO_STEPS.length - 1 ? 'Finish Tour' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
};
