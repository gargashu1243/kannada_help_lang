import rawPhrasesData from '../data/phrases.json';

/**
 * High-fidelity Kannada Speech Engine & Fallback Manager
 *
 * 1. Primary: Gemini 3.8 Flash Lite TTS (server-side generation with client + server caching)
 * 2. Fallback: Browser Web Speech API (SpeechSynthesis)
 *    - Detects whether native Kannada voice engine ('kn-IN' / 'Kannada') is installed on the OS/browser.
 *    - If native Kannada engine is missing, uses phonetic transliteration (Roman syllables) with
 *      Indian English / system voice, and provides an informative user notification.
 *    - Explicitly detects and handles browser permission/autoplay blocks ('NotAllowedError', 'not-allowed').
 *    - Ensures window.speechSynthesis is initialized with voice availability checks.
 */

export interface SpeechEngineStatus {
  isSupported: boolean;
  isInitialized: boolean;
  availableVoicesCount: number;
  hasNativeKannadaVoice: boolean;
  nativeVoiceName?: string;
  warningNotice?: string;
}

export type SpeechErrorType =
  | 'permission_denied'
  | 'no_speech_engine'
  | 'unsupported_browser'
  | 'audio_busy'
  | 'quota_exhausted'
  | 'unknown';

export interface SpeakOptions {
  slow?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (msg: string, errorType?: SpeechErrorType) => void;
  onNotice?: (notice: string, isFallback: boolean) => void;
}

export interface SpeakResult {
  success: boolean;
  hasVoice: boolean;
  source?: 'gemini-tts' | 'browser-speech' | 'none';
  isNativeVoice?: boolean;
  isTransliteratedFallback?: boolean;
  isPermissionBlocked?: boolean;
  errorType?: SpeechErrorType;
  note?: string;
  warningNotice?: string;
}

const BASE_PHRASES = rawPhrasesData.phrases;

// Unicode tables for Kannada script transliteration
const KANNADA_VOWELS: Record<number, string> = {
  0x0c85: 'a',
  0x0c86: 'aa',
  0x0c87: 'i',
  0x0c88: 'ee',
  0x0c89: 'u',
  0x0c8a: 'oo',
  0x0c8b: 'ru',
  0x0c8e: 'e',
  0x0c8f: 'e',
  0x0c90: 'ai',
  0x0c92: 'o',
  0x0c93: 'o',
  0x0c94: 'au',
};

const KANNADA_CONSONANTS: Record<number, string> = {
  0x0c95: 'k',
  0x0c96: 'kh',
  0x0c97: 'g',
  0x0c98: 'gh',
  0x0c99: 'ng',
  0x0c9a: 'ch',
  0x0c9b: 'ch',
  0x0c9c: 'j',
  0x0c9d: 'jh',
  0x0c9e: 'ny',
  0x0c9f: 't',
  0x0ca0: 'th',
  0x0ca1: 'd',
  0x0ca2: 'dh',
  0x0ca3: 'n',
  0x0ca4: 'th',
  0x0ca5: 'th',
  0x0ca6: 'd',
  0x0ca7: 'dh',
  0x0ca8: 'n',
  0x0caa: 'p',
  0x0cab: 'ph',
  0x0cac: 'b',
  0x0cad: 'bh',
  0x0cae: 'm',
  0x0caf: 'y',
  0x0cb0: 'r',
  0x0cb1: 'r',
  0x0cb2: 'l',
  0x0cb3: 'l',
  0x0cb5: 'v',
  0x0cb6: 'sh',
  0x0cb7: 'sh',
  0x0cb8: 's',
  0x0cb9: 'h',
};

const KANNADA_MATRAS: Record<number, string> = {
  0x0cbe: 'aa',
  0x0cbf: 'i',
  0x0cc0: 'ee',
  0x0cc1: 'u',
  0x0cc2: 'oo',
  0x0cc3: 'ru',
  0x0cc6: 'e',
  0x0cc7: 'e',
  0x0cc8: 'ai',
  0x0cca: 'o',
  0x0ccb: 'o',
  0x0ccc: 'au',
};

const VIRAMA = 0x0ccd; // ್
const ANUSVARA = 0x0c82; // ಂ
const VISARGA = 0x0c83; // ಃ

/**
 * Phonetically transliterates Kannada Unicode script into natural Roman syllables
 * allowing any system voice (e.g. Indian English or default voice) to pronounce
 * authentic Kannada clearly without failing on Kannada glyphs.
 */
export function kannadaToPhoneticRoman(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    if (KANNADA_VOWELS[code]) {
      result += KANNADA_VOWELS[code];
    } else if (KANNADA_CONSONANTS[code]) {
      const consonant = KANNADA_CONSONANTS[code];
      const nextCode = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;

      if (nextCode === VIRAMA) {
        result += consonant;
        i++; // skip virama
      } else if (KANNADA_MATRAS[nextCode]) {
        result += consonant + KANNADA_MATRAS[nextCode];
        i++; // skip matra
      } else {
        result += consonant + 'a';
      }
    } else if (code === ANUSVARA) {
      result += 'm';
    } else if (code === VISARGA) {
      result += 'h';
    } else if (code === VIRAMA) {
      // orphaned virama, ignore
    } else {
      // Keep spaces, punctuation, Latin letters, numbers
      result += text[i];
    }
  }
  return result;
}

/**
 * Get natural phonetic text for browser speech fallback.
 * Prioritizes hand-tuned human transliterations for scenario phrases.
 */
export function getSpokenFallbackText(text: string): string {
  const clean = text.trim();
  const matched = BASE_PHRASES.find(
    p => p.kannada.trim() === clean || clean.includes(p.kannada.trim())
  );
  if (matched && matched.englishTranslit) {
    return matched.englishTranslit;
  }
  const converted = kannadaToPhoneticRoman(clean);
  return converted || clean;
}

// In-memory cache for generated base64 WAV audio clips
const memoryAudioCache = new Map<string, string>();
const STORAGE_PREFIX = 'ks_tts_audio_';

// Track currently active audio element
let currentAudio: HTMLAudioElement | null = null;
let currentSpeechCancel: (() => void) | null = null;

// SpeechSynthesis voices cache and initialization promise
let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];
let voiceLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Robustly load and check initialization of browser voices across all engines (Blink, WebKit, Gecko).
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  // If already loaded and populated, return immediately
  if (voicesLoaded && availableVoices.length > 0) {
    return Promise.resolve(availableVoices);
  }

  if (voiceLoadPromise) {
    return voiceLoadPromise;
  }

  voiceLoadPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    try {
      const current = window.speechSynthesis.getVoices();
      if (current && current.length > 0) {
        availableVoices = current;
        voicesLoaded = true;
        resolve(current);
        return;
      }
    } catch {
      // Ignore read errors
    }

    let isDone = false;
    const finish = () => {
      if (isDone) return;
      isDone = true;
      try {
        const v = window.speechSynthesis.getVoices() || [];
        availableVoices = v;
        voicesLoaded = v.length > 0;
        resolve(v);
      } catch {
        resolve([]);
      }
    };

    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = finish;
    }
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
    }

    // Safety timeout: Chrome/Edge sometimes delay voiceschanged, and Safari/Firefox may not fire it if already loaded
    setTimeout(finish, 450);
  });

  return voiceLoadPromise;
}

// Pre-trigger voice initialization in browser environments
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices().catch(() => {});
}

/**
 * Check whether SpeechSynthesis is initialized with voices loaded.
 */
export function isSpeechSynthesisInitialized(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return voicesLoaded || (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices().length > 0);
}

export interface KannadaVoiceDetectionResult {
  hasNativeVoice: boolean;
  kannadaVoice?: SpeechSynthesisVoice;
  recommendedVoice?: SpeechSynthesisVoice;
  warningNotice?: string;
}

/**
 * Detects whether a native Kannada voice engine is available on the user's OS/browser.
 * If not present, finds the best phonetic replacement (Indian English, Hindi, or standard voice)
 * and generates a friendly advisory notification.
 */
export function detectKannadaVoice(voicesInput?: SpeechSynthesisVoice[]): KannadaVoiceDetectionResult {
  const voices = voicesInput || availableVoices;

  const kannadaVoice = voices.find(
    v =>
      v.lang.toLowerCase().startsWith('kn') ||
      v.name.toLowerCase().includes('kannada') ||
      v.voiceURI.toLowerCase().includes('kannada')
  );

  if (kannadaVoice) {
    return {
      hasNativeVoice: true,
      kannadaVoice,
      recommendedVoice: kannadaVoice,
    };
  }

  // Find the closest authentic sounding pronunciation engine
  const indianEnglishVoice = voices.find(
    v =>
      v.lang.toLowerCase().includes('en-in') ||
      v.name.toLowerCase().includes('india') ||
      v.voiceURI.toLowerCase().includes('en-in')
  );

  const hindiVoice = voices.find(
    v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
  );

  const englishVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));

  const recommendedVoice = indianEnglishVoice || hindiVoice || englishVoice || voices[0];

  const warningNotice =
    'No native Kannada voice engine detected on your operating system or browser. Playing authentic phonetic pronunciation. (To get native Kannada voice, you can install the Kannada language speech pack in your OS language settings).';

  return {
    hasNativeVoice: false,
    recommendedVoice,
    warningNotice,
  };
}

/**
 * Query current speech engine support status
 */
export function getSpeechEngineStatus(): SpeechEngineStatus {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      isSupported: false,
      isInitialized: false,
      availableVoicesCount: 0,
      hasNativeKannadaVoice: false,
      warningNotice: 'Web Speech API is not supported in this browser.',
    };
  }

  const voices = availableVoices.length > 0 ? availableVoices : (window.speechSynthesis.getVoices?.() || []);
  const detection = detectKannadaVoice(voices);

  return {
    isSupported: true,
    isInitialized: isSpeechSynthesisInitialized(),
    availableVoicesCount: voices.length,
    hasNativeKannadaVoice: detection.hasNativeVoice,
    nativeVoiceName: detection.kannadaVoice?.name,
    warningNotice: detection.warningNotice,
  };
}

/**
 * Check if the browser or OS has an active Kannada voice pack
 */
export function checkKannadaVoiceSupport(): KannadaVoiceDetectionResult {
  return detectKannadaVoice();
}

/**
 * Retrieve cached audio for a given text if available
 */
function getCachedAudio(text: string): string | null {
  const key = text.trim();
  if (memoryAudioCache.has(key)) {
    return memoryAudioCache.get(key)!;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (stored) {
        memoryAudioCache.set(key, stored);
        return stored;
      }
    } catch {
      // ignore storage quota errors
    }
  }
  return null;
}

/**
 * Cache audio in memory and localStorage
 */
function setCachedAudio(text: string, base64Audio: string) {
  const key = text.trim();
  memoryAudioCache.set(key, base64Audio);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (base64Audio.length < 250000) {
        localStorage.setItem(STORAGE_PREFIX + key, base64Audio);
      }
    } catch {
      // ignore if quota exceeded
    }
  }
}

/**
 * Stop any active audio playback (both Gemini TTS audio and browser speech synthesis)
 */
export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.onplay = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;
    } catch {
      // ignore
    }
    currentAudio = null;
  }

  if (currentSpeechCancel) {
    currentSpeechCancel();
    currentSpeechCancel = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

// Alias for backwards compatibility
export const stopSpeech = stopSpeaking;

/**
 * Speaks Kannada text with high resilience:
 * 1. Checks local cache for pre-rendered Gemini TTS audio.
 * 2. Queries Gemini 3.8 Flash Lite TTS endpoint (/api/gemini/tts).
 * 3. Plays authentic audio via HTML5 Audio with explicit browser permission/autoplay block handling.
 * 4. Gracefully falls back to browser SpeechSynthesis with full voice-engine detection and phonetic transliteration.
 */
export async function speakKannada(
  text: string,
  options?: SpeakOptions
): Promise<SpeakResult> {
  const cleanedText = text.trim();
  if (!cleanedText) {
    options?.onError?.('No text provided to speak.', 'unknown');
    return { success: false, hasVoice: false, note: 'Empty text', source: 'none' };
  }

  // Stop any currently playing audio before starting new playback
  stopSpeaking();

  // 1. Check local client cache first
  let base64Audio = getCachedAudio(cleanedText);

  // 2. If not cached, call server Gemini TTS endpoint
  if (!base64Audio) {
    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanedText,
          voiceName: 'Kore',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.audioBase64 === 'string' && data.audioBase64) {
          base64Audio = data.audioBase64;
          setCachedAudio(cleanedText, data.audioBase64);
        }
      }
    } catch (err) {
      // Non-fatal, gracefully fall through to browser speech fallback
      console.warn('Gemini TTS fetch fell back:', err);
    }
  }

  // 3. Play base64 WAV audio if available
  if (base64Audio) {
    return new Promise(resolve => {
      let audio: HTMLAudioElement;
      try {
        audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      } catch (audioInitErr) {
        console.warn('HTML5 Audio construction failed, using browser speech:', audioInitErr);
        fallbackToBrowserSpeech(cleanedText, options).then(resolve);
        return;
      }

      currentAudio = audio;

      if (options?.slow) {
        audio.playbackRate = 0.82;
      }

      audio.onplay = () => {
        options?.onStart?.();
      };

      audio.onended = () => {
        currentAudio = null;
        options?.onEnd?.();
        resolve({
          success: true,
          hasVoice: true,
          source: 'gemini-tts',
          isNativeVoice: true,
          note: 'Gemini 3.8 Flash Lite TTS (Clear & authentic)',
        });
      };

      audio.onerror = () => {
        currentAudio = null;
        // Fall back to browser speech if audio decoding/playback encounters error
        fallbackToBrowserSpeech(cleanedText, options).then(resolve);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          currentAudio = null;

          // Check for browser permission or autoplay policy restriction
          const isPermissionBlocked =
            err?.name === 'NotAllowedError' ||
            err?.name === 'SecurityError' ||
            (typeof err?.message === 'string' &&
              (err.message.toLowerCase().includes('not allowed') ||
               err.message.toLowerCase().includes('user gesture') ||
               err.message.toLowerCase().includes('autoplay') ||
               err.message.toLowerCase().includes('interact')));

          if (isPermissionBlocked) {
            const blockedNotice =
              'Audio playback was blocked by browser permissions or autoplay policy. Please click directly on the listen button to enable sound.';
            options?.onError?.(blockedNotice, 'permission_denied');
            options?.onEnd?.();
            resolve({
              success: false,
              hasVoice: true,
              source: 'gemini-tts',
              isPermissionBlocked: true,
              errorType: 'permission_denied',
              note: blockedNotice,
              warningNotice: blockedNotice,
            });
            return;
          }

          // If not a permission block, try browser speech synthesis fallback
          fallbackToBrowserSpeech(cleanedText, options).then(resolve);
        });
      }
    });
  }

  // 4. Fallback: Browser Web Speech API with voice detection and authentic phonetic transliteration
  return fallbackToBrowserSpeech(cleanedText, options);
}

/**
 * Fallback to browser SpeechSynthesis API with phonetic pronunciation and engine detection
 */
async function fallbackToBrowserSpeech(
  text: string,
  options?: SpeakOptions
): Promise<SpeakResult> {
  // Check if Web Speech API exists
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
    const errorMsg = 'Speech synthesis is not supported in this browser.';
    options?.onError?.(errorMsg, 'unsupported_browser');
    options?.onEnd?.();
    return {
      success: false,
      hasVoice: false,
      source: 'none',
      errorType: 'unsupported_browser',
      note: errorMsg,
      warningNotice: errorMsg,
    };
  }

  // Ensure speech synthesis queue is unblocked and resumed
  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    // Ignore internal browser synthesis state errors
  }

  // Load and verify voices
  const voices = await loadVoices();
  const detection = detectKannadaVoice(voices);

  let textToSpeak = text;
  let selectedVoice = detection.kannadaVoice;
  let selectedLang = 'kn-IN';
  const isNative = detection.hasNativeVoice;
  const isFallback = !isNative;

  if (!isNative) {
    // Crucial: When the platform does not have a native Kannada voice installed,
    // feeding Kannada script to an English/default voice results in silence or abort.
    // Transliterating to phonetic Roman allows Indian English and standard voices
    // to pronounce the words clearly and audibly!
    textToSpeak = getSpokenFallbackText(text);
    selectedVoice = detection.recommendedVoice;
    selectedLang = selectedVoice?.lang || 'en-IN';

    // Notify caller that fallback phonetic pronunciation is being used
    if (detection.warningNotice) {
      options?.onNotice?.(detection.warningNotice, true);
    }
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = selectedLang;
  utterance.rate = options?.slow ? 0.72 : 0.88;
  utterance.pitch = 1.0;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  return new Promise(resolve => {
    let finished = false;

    // Safety timeout in case the browser speech engine stalls indefinitely
    const timeoutDuration = Math.max(4500, textToSpeak.length * 150);
    const safetyTimer = setTimeout(() => {
      if (!finished) {
        finished = true;
        currentSpeechCancel = null;
        options?.onEnd?.();
        resolve({
          success: true,
          hasVoice: voices.length > 0,
          source: 'browser-speech',
          isNativeVoice: isNative,
          isTransliteratedFallback: isFallback,
          warningNotice: detection.warningNotice,
          note: isNative ? `Completed via Kannada voice` : `Completed via phonetic pronunciation (${selectedLang})`,
        });
      }
    }, timeoutDuration);

    currentSpeechCancel = () => {
      finished = true;
      clearTimeout(safetyTimer);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        currentSpeechCancel = null;
        options?.onEnd?.();
        resolve({
          success: true,
          hasVoice: voices.length > 0,
          source: 'browser-speech',
          isNativeVoice: isNative,
          isTransliteratedFallback: isFallback,
          warningNotice: detection.warningNotice,
          note: isNative
            ? `Native Kannada voice: ${selectedVoice?.name || 'kn-IN'}`
            : `Phonetic pronunciation (${selectedLang})`,
        });
      }
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      console.warn('Speech synthesis event notice:', e.error || e);
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        currentSpeechCancel = null;
        options?.onEnd?.();

        const isPermission = e.error === 'not-allowed';
        const isBusy = e.error === 'audio-busy';
        const isUnavailable = e.error === 'voice-unavailable' || e.error === 'synthesis-unavailable';

        let errType: SpeechErrorType = 'unknown';
        let errMsg = 'Speech synthesis failed.';

        if (isPermission) {
          errType = 'permission_denied';
          errMsg = 'Audio playback was blocked by browser permissions or autoplay policy. Click directly on the speaker icon to enable sound.';
        } else if (isBusy) {
          errType = 'audio_busy';
          errMsg = 'Audio hardware or speech engine is currently busy.';
        } else if (isUnavailable) {
          errType = 'no_speech_engine';
          errMsg = 'Speech synthesis engine is unavailable on this device.';
        }

        options?.onError?.(errMsg, errType);

        resolve({
          success: false,
          hasVoice: voices.length > 0,
          source: 'browser-speech',
          isNativeVoice: isNative,
          isPermissionBlocked: isPermission,
          errorType: errType,
          warningNotice: isPermission ? errMsg : detection.warningNotice,
          note: errMsg,
        });
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (speakErr: any) {
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        options?.onEnd?.();

        const isPermission = speakErr?.name === 'NotAllowedError';
        const errType: SpeechErrorType = isPermission ? 'permission_denied' : 'no_speech_engine';
        const errMsg = isPermission
          ? 'Audio playback was blocked by browser permissions. Please tap or click directly to enable sound.'
          : 'Browser speech synthesis trigger failed.';

        options?.onError?.(errMsg, errType);

        resolve({
          success: false,
          hasVoice: false,
          source: 'browser-speech',
          isPermissionBlocked: isPermission,
          errorType: errType,
          note: errMsg,
          warningNotice: errMsg,
        });
      }
    }
  });
}

/**
 * Check if the browser supports the Web Speech API SpeechRecognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Maps app language codes to BCP-47 speech recognition locales
 */
export function getSpeechRecognitionLocale(langCode: string): string {
  switch (langCode) {
    case 'kn':
      return 'kn-IN';
    case 'hi':
      return 'hi-IN';
    case 'mr':
      return 'mr-IN';
    case 'bn':
      return 'bn-IN';
    case 'te':
      return 'te-IN';
    case 'ta':
      return 'ta-IN';
    case 'en':
      return 'en-IN';
    default:
      return 'en-IN';
  }
}

/**
 * Speak text in any target language supported by the app.
 * If language is Kannada ('kn'), delegates to high-fidelity speakKannada() (Gemini TTS + fallback).
 * If another Indic language or English, uses SpeechSynthesis with the matching locale.
 */
export async function speakInLanguage(
  text: string,
  langCode: string,
  options?: SpeakOptions
): Promise<SpeakResult> {
  const clean = text.trim();
  if (!clean) {
    options?.onError?.('No text provided to speak.');
    return { success: false, hasVoice: false, note: 'Empty text' };
  }

  if (langCode === 'kn') {
    return speakKannada(clean, options);
  }

  // Stop any ongoing speech
  stopSpeaking();

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    const errorMsg = 'Speech synthesis is not supported on this device/browser.';
    options?.onError?.(errorMsg, 'unsupported_browser');
    return { success: false, hasVoice: false, note: errorMsg };
  }

  // Cancel prior
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }

  const locale = getSpeechRecognitionLocale(langCode);
  const voices = await loadVoices();

  // Find a voice matching the language code or prefix
  const targetVoice = voices.find(
    v =>
      v.lang.toLowerCase() === locale.toLowerCase() ||
      v.lang.toLowerCase().startsWith(langCode.toLowerCase())
  ) || voices.find(v => v.lang.toLowerCase().includes('in')) || voices[0];

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = locale;
  utterance.rate = options?.slow ? 0.72 : 0.92;
  utterance.pitch = 1.0;
  if (targetVoice) utterance.voice = targetVoice;

  return new Promise(resolve => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        options?.onEnd?.();
        resolve({ success: true, hasVoice: !!targetVoice });
      }
    }, Math.max(3500, clean.length * 120));

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        options?.onEnd?.();
        resolve({ success: true, hasVoice: true });
      }
    };

    utterance.onerror = (e) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        options?.onEnd?.();
        options?.onError?.('Speech playback failed: ' + (e.error || 'error'));
        resolve({ success: false, hasVoice: !!targetVoice });
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        options?.onError?.(err?.message || 'Speech failed');
        resolve({ success: false, hasVoice: false });
      }
    }
  });
}

