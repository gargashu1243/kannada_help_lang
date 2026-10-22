import rawPhrasesData from '../data/phrases.json';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../data/languages';
import { PRECOMPUTED_DICTIONARY, TranslatedPhrase } from '../data/precomputedDictionary';

export interface PhraseItem {
  id: string;
  scenarioId: string;
  kannada: string;
  english: string;
  englishTranslit: string;
  context: string;
}

export interface ScenarioItem {
  id: string;
  title: string;
  titleKannada: string;
  icon: string;
  color: string;
  badge: string;
  roleplayRole: string;
  roleplayIntro: string;
}

export const SCENARIOS: ScenarioItem[] = rawPhrasesData.scenarios;
export const BASE_PHRASES: PhraseItem[] = rawPhrasesData.phrases;

const STORAGE_CACHE_KEY_PREFIX = 'kannada_saathi_cache_';
const PROGRESS_STORAGE_KEY = 'kannada_saathi_progress_v1';
const SELECTED_LANG_KEY = 'kannada_saathi_lang_v1';

export function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(SELECTED_LANG_KEY);
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
  } catch (e) {
    // ignore
  }
  return '';
}

export function saveStoredLanguage(langCode: string): void {
  try {
    localStorage.setItem(SELECTED_LANG_KEY, langCode);
  } catch (e) {
    // ignore
  }
}

export function getLanguageConfig(langCode: string): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find(l => l.code === langCode) ||
    SUPPORTED_LANGUAGES[0] // fallback to Hindi
  );
}

export function getPhraseTranslation(
  phraseId: string,
  langCode: string
): TranslatedPhrase | null {
  // 1. Try local storage cache
  try {
    const raw = localStorage.getItem(`${STORAGE_CACHE_KEY_PREFIX}${langCode}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[phraseId]) {
        return parsed[phraseId];
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Try precomputed dictionary
  if (PRECOMPUTED_DICTIONARY[phraseId]?.[langCode]) {
    return PRECOMPUTED_DICTIONARY[phraseId][langCode];
  }

  // 3. Fallback to base English transliteration and phrase meaning
  const phrase = BASE_PHRASES.find(p => p.id === phraseId);
  if (phrase) {
    return {
      transliteration: phrase.englishTranslit,
      meaning: phrase.english,
    };
  }

  return null;
}

export function cacheTranslations(
  langCode: string,
  translations: Record<string, TranslatedPhrase>
): void {
  try {
    const key = `${STORAGE_CACHE_KEY_PREFIX}${langCode}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const merged = { ...existing, ...translations };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {
    // ignore
  }
}

export interface QuizQuestion {
  id: string;
  scenarioId: string;
  phraseId: string;
  promptMeaning: string; // "Meaning in learner's language"
  context: string;
  correctKannada: string;
  correctTranslit: string;
  options: {
    kannada: string;
    translit: string;
    isCorrect: boolean;
  }[];
}

export function generateQuizForScenario(
  scenarioId: string,
  langCode: string,
  limit = 5
): QuizQuestion[] {
  const scenarioPhrases = BASE_PHRASES.filter(p => p.scenarioId === scenarioId);
  const otherPhrases = BASE_PHRASES.filter(p => p.scenarioId !== scenarioId);

  // Deterministic shuffle using scenario + phraseId hash so questions are stable per view
  const questions: QuizQuestion[] = [];

  for (const phrase of scenarioPhrases.slice(0, limit)) {
    const translitInfo = getPhraseTranslation(phrase.id, langCode) || {
      transliteration: phrase.englishTranslit,
      meaning: phrase.english,
    };

    // Pick 3 distractors
    const pool = scenarioPhrases
      .filter(p => p.id !== phrase.id)
      .concat(otherPhrases);

    // Pick 3 distinct options
    const distractors = pool.slice(0, 3).map(p => {
      const dInfo = getPhraseTranslation(p.id, langCode) || {
        transliteration: p.englishTranslit,
        meaning: p.english,
      };
      return {
        kannada: p.kannada,
        translit: dInfo.transliteration,
        isCorrect: false,
      };
    });

    const allOptions = [
      {
        kannada: phrase.kannada,
        translit: translitInfo.transliteration,
        isCorrect: true,
      },
      ...distractors,
    ];

    // pseudo-random deterministic rotation based on phrase length
    const rotateIndex = phrase.kannada.length % 4;
    const rotatedOptions = [
      ...allOptions.slice(rotateIndex),
      ...allOptions.slice(0, rotateIndex),
    ];

    questions.push({
      id: `quiz_${phrase.id}`,
      scenarioId,
      phraseId: phrase.id,
      promptMeaning: translitInfo.meaning,
      context: phrase.context,
      correctKannada: phrase.kannada,
      correctTranslit: translitInfo.transliteration,
      options: rotatedOptions,
    });
  }

  return questions;
}

export interface UserProgress {
  learnedPhraseIds: string[];
  completedScenarios: string[];
  quizScores: Record<string, { score: number; total: number; completedAt: string }>;
  roleplayCompleted: string[]; // scenarioIds
  badges: string[];
}

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }

  return {
    learnedPhraseIds: [],
    completedScenarios: [],
    quizScores: {},
    roleplayCompleted: [],
    badges: [],
  };
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    // ignore
  }
}

export function evaluateBadges(progress: UserProgress): string[] {
  const badges: string[] = [];

  if (progress.learnedPhraseIds.length >= 3) {
    badges.push('First Steps in Kannada (ಮೊದಲ ಹೆಜ್ಜೆ)');
  }
  if (progress.learnedPhraseIds.length >= 10) {
    badges.push('Bengaluru Explorer (ಬೆಂಗಳೂರು ಯಾತ್ರಿಕ)');
  }
  if (progress.completedScenarios.length >= 1) {
    badges.push('Scenario Master (ಪರಿಸ್ಥಿತಿ ಜಯಿಸಿದವರು)');
  }
  if (progress.roleplayCompleted.length >= 1) {
    badges.push('AI Conversation Hero (ಧೈರ್ಯಶಾಲಿ ಸಂಭಾಷಕ)');
  }
  const quizzesDone = Object.keys(progress.quizScores).length;
  if (quizzesDone >= 1) {
    badges.push('Quiz Champ (ಕ್ವಿಜ್ ಚಾಂಪಿಯನ್)');
  }
  if (progress.learnedPhraseIds.length >= 25) {
    badges.push('Kannada Saathi Scholar (ಕನ್ನಡ ಸಾಥಿ ವಿದ್ವಾಂಸ)');
  }

  return badges;
}
