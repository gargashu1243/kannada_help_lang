import React from 'react';
import { getLanguageConfig, UI_STRINGS } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Sparkles,
  BookOpen,
  HelpCircle,
  MessageSquareText,
  Bot,
  GitCompare,
  Trophy,
  Compass,
  Mic,
  LogIn,
  LogOut,
  User as UserIcon,
  CloudCheck,
  Speech,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab = 'scenarios' | 'livetalk' | 'quiz' | 'roleplay' | 'chatbot' | 'bridge' | 'progress' | 'selfcheck';

interface HeaderProps {
  currentLanguage: string;
  onOpenLanguageModal: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onStartDemoTour: () => void;
  onOpenTranscribe: () => void;
  badgeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onOpenLanguageModal,
  activeTab,
  onSelectTab,
  onStartDemoTour,
  onOpenTranscribe,
  badgeCount,
}) => {
  const langConfig = getLanguageConfig(currentLanguage);
  const strings = UI_STRINGS[currentLanguage] || UI_STRINGS.hi;
  const { user, loginWithGoogle, logout } = useAuth();

  const navItems = [
    { id: 'scenarios', label: strings.tabs.scenarios, icon: BookOpen },
    { id: 'livetalk', label: 'Live Talk (ಸಂವಾದ)', icon: Speech, isNew: true },
    { id: 'quiz', label: strings.tabs.quiz, icon: HelpCircle },
    { id: 'roleplay', label: strings.tabs.roleplay, icon: MessageSquareText },
    { id: 'chatbot', label: 'AI Chatbot', icon: Bot },
    { id: 'bridge', label: strings.tabs.bridge, icon: GitCompare },
    { id: 'progress', label: strings.tabs.progress, icon: Trophy, count: badgeCount },
    { id: 'selfcheck', label: 'Self-Check', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Karnataka flag ribbon at top */}
      <div className="h-1.5 w-full karnataka-flag-bar" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('scenarios')}
              className="flex items-center gap-2.5 text-left group"
              aria-label="Kannada Saathi Home"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-kannada font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                ಕ
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-stone-900 tracking-tight text-lg">
                    Kannada Saathi
                  </span>
                  <span className="font-kannada text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                    ಕನ್ನಡ ಸಾಥಿ
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                  Kannada Technology Challenge 2026
                </p>
              </div>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Voice Transcribe Button (gemini-3.5-transcribe) */}
            <button
              onClick={onOpenTranscribe}
              className="p-2 rounded-xl border border-stone-200 hover:border-red-400 hover:bg-red-50 text-red-600 text-xs font-bold transition-all shadow-xs"
              title="Voice Input (gemini-3.5-transcribe)"
              aria-label="Transcribe voice audio"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Demo Tour Button for Judges */}
            <button
              onClick={onStartDemoTour}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md hover:from-red-700 hover:to-amber-700 transition-all active:scale-95"
              title="Step-by-step hackathon demo flow for judges"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{strings.actions.demoTour}</span>
              <span className="xs:hidden">Demo</span>
            </button>

            {/* Language Switcher Button */}
            <button
              onClick={onOpenLanguageModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-amber-300 text-stone-800 text-xs font-semibold transition-all group"
              aria-label="Change native language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
              <div className="flex items-center gap-1">
                <span className="font-bold">{langConfig.nativeName}</span>
                {langConfig.isVerified ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Verified" />
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1 rounded font-medium">
                    Beta
                  </span>
                )}
              </div>
            </button>

            {/* Firebase Auth Google Sign In Button */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1">
                <img
                  src={user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=kannada'}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-amber-300 shadow-xs"
                />
                <button
                  onClick={logout}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-700 text-xs font-bold transition-all shadow-xs"
                aria-label="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav
          className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-stone-100 py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          aria-label="Main Navigation"
        >
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{item.label}</span>
                {item.isNew && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-white font-extrabold tracking-wide uppercase">
                    New
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-amber-400 text-red-950 font-bold' : 'bg-red-100 text-red-700 font-bold'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
