import React from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../data/languages';
import { Check, Sparkles, Globe, X, ShieldCheck } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose?: () => void;
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  isInitialSetup?: boolean;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  isInitialSetup = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-amber-200 overflow-hidden relative flex flex-col max-h-[92vh]"
        role="dialog"
        aria-labelledby="language-modal-title"
        aria-modal="true"
      >
        {/* Karnataka decorative top strip */}
        <div className="h-2 w-full karnataka-flag-bar" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-stone-100 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ಕನ್ನಡ ಸಾಥಿ • Choose Your Mother Tongue</span>
            </div>
            <h2 id="language-modal-title" className="text-2xl font-bold text-stone-900">
              {isInitialSetup ? 'Select Your Native Language' : 'Switch Native Language'}
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              All translations, pronunciations, and AI explanations will adapt to your language.
            </p>
          </div>

          {!isInitialSetup && onClose && (
            <button
              onClick={onClose}
              aria-label="Close language selector"
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Language Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => {
              const isSelected = selectedLanguage === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    if (onClose) onClose();
                  }}
                  className={`relative p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between group ${
                    isSelected
                      ? 'border-red-600 bg-red-50/50 shadow-md ring-2 ring-red-500/20'
                      : 'border-stone-200 hover:border-amber-400 hover:bg-amber-50/30'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-stone-900">{lang.nativeName}</span>
                        <span className="text-xs text-stone-500">({lang.name})</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{lang.regionHint}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {lang.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                          {lang.statusBadge || 'Beta'}
                        </span>
                      )}

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-600 italic font-medium">"{lang.sampleGreeting}"</span>
                    <span className="text-amber-800 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Linguistic note */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5 mt-2">
            <Globe className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                India has 22 official languages. Learn Kannada through your own.
              </p>
              <p className="text-amber-800 mt-0.5">
                <strong>Hindi</strong> has been fully verified with human linguistic audit.
                Marathi, Bengali, Telugu, Tamil, and English utilize AI transliteration and meaning caching.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        {isInitialSetup && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
            <button
              onClick={() => {
                if (selectedLanguage) {
                  onSelectLanguage(selectedLanguage);
                  if (onClose) onClose();
                }
              }}
              disabled={!selectedLanguage}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold shadow-md transition-colors"
            >
              Start Learning Kannada →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
