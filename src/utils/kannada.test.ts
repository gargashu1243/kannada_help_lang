import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_PHRASES,
  SCENARIOS,
  getPhraseTranslation,
  generateQuizForScenario,
  evaluateBadges,
  UserProgress,
} from './kannada';

test('scenarios configuration contains 6 required real-world situations', () => {
  assert.equal(SCENARIOS.length, 6);
  const ids = SCENARIOS.map(s => s.id);
  assert.ok(ids.includes('travel'));
  assert.ok(ids.includes('shopping'));
  assert.ok(ids.includes('hospital'));
  assert.ok(ids.includes('college'));
  assert.ok(ids.includes('workplace'));
  assert.ok(ids.includes('daily_life'));
});

test('each scenario has between 8 and 10 practical phrases', () => {
  for (const scenario of SCENARIOS) {
    const phrases = BASE_PHRASES.filter(p => p.scenarioId === scenario.id);
    assert.ok(
      phrases.length >= 8 && phrases.length <= 10,
      `Scenario ${scenario.id} has ${phrases.length} phrases, expected 8-10`
    );
  }
});

test('getPhraseTranslation returns verified Hindi translation and Devanagari transliteration', () => {
  const trans = getPhraseTranslation('travel_1', 'hi');
  assert.ok(trans !== null);
  assert.equal(trans?.transliteration, 'मीटर हाकी सर');
  assert.equal(trans?.meaning, 'कृपया मीटर चालू कीजिये सर।');
});

test('getPhraseTranslation returns transliteration in native script for Marathi, Bengali, Telugu, Tamil', () => {
  const mr = getPhraseTranslation('shopping_1', 'mr');
  assert.equal(mr?.transliteration, 'इदु एष्टु रूपायि?');

  const bn = getPhraseTranslation('shopping_1', 'bn');
  assert.equal(bn?.transliteration, 'ইদু এশ্টু রূপায়ি?');

  const te = getPhraseTranslation('hospital_1', 'te');
  assert.equal(te?.transliteration, 'డాక్టర్ యావాగ సిగ్తారె?');

  const ta = getPhraseTranslation('hospital_1', 'ta');
  assert.equal(ta?.transliteration, 'டாக்டர் யாவாக சிக்தாரே?');
});

test('generateQuizForScenario produces valid questions with correct answers', () => {
  const questions = generateQuizForScenario('hospital', 'hi', 4);
  assert.equal(questions.length, 4);

  for (const q of questions) {
    assert.equal(q.scenarioId, 'hospital');
    assert.ok(q.promptMeaning.length > 0);
    assert.ok(q.options.length >= 4);
    const correctOptions = q.options.filter(o => o.isCorrect);
    assert.equal(correctOptions.length, 1);
    assert.equal(correctOptions[0].kannada, q.correctKannada);
  }
});

test('evaluateBadges unlocks badges based on user milestones', () => {
  const initial: UserProgress = {
    learnedPhraseIds: ['travel_1', 'travel_2'],
    completedScenarios: [],
    quizScores: {},
    roleplayCompleted: [],
    badges: [],
  };
  assert.deepEqual(evaluateBadges(initial), []);

  const unlocked = evaluateBadges({
    ...initial,
    learnedPhraseIds: ['travel_1', 'travel_2', 'travel_3'],
    completedScenarios: ['hospital'],
    roleplayCompleted: ['hospital'],
    quizScores: { hospital: { score: 5, total: 5, completedAt: '2026-10-22' } },
  });

  assert.ok(unlocked.includes('First Steps in Kannada (ಮೊದಲ ಹೆಜ್ಜೆ)'));
  assert.ok(unlocked.includes('Scenario Master (ಪರಿಸ್ಥಿತಿ ಜಯಿಸಿದವರು)'));
  assert.ok(unlocked.includes('AI Conversation Hero (ಧೈರ್ಯಶಾಲಿ ಸಂಭಾಷಕ)'));
  assert.ok(unlocked.includes('Quiz Champ (ಕ್ವಿಜ್ ಚಾಂಪಿಯನ್)'));
});

test('kannadaToPhoneticRoman generates pronounceable Roman syllables for Kannada text', async () => {
  const { kannadaToPhoneticRoman, getSpokenFallbackText } = await import('./speech.js');
  
  const greeting = kannadaToPhoneticRoman('ನಮಸ್ಕಾರ');
  assert.ok(greeting.toLowerCase().includes('namaskaar') || greeting.toLowerCase().includes('namaskara'), `Got: ${greeting}`);

  const thanks = kannadaToPhoneticRoman('ಧನ್ಯವಾದ');
  assert.ok(thanks.toLowerCase().includes('dhanyavaad') || thanks.toLowerCase().includes('dhanyavada'), `Got: ${thanks}`);

  // Test getSpokenFallbackText produces authentic phonetic transliteration
  const fallbackDynamic = getSpokenFallbackText('ದಯವಿಟ್ಟು ಮೀಟರ್ ಹಾಕಿ');
  assert.ok(
    fallbackDynamic.toLowerCase().includes('meetar') || fallbackDynamic.toLowerCase().includes('meter'),
    `Got: ${fallbackDynamic}`
  );

  const fallbackStandard = getSpokenFallbackText('ಮೀಟರ್ ಹಾಕಿ ಸರ್');
  assert.ok(
    fallbackStandard.toLowerCase().includes('meter') || fallbackStandard.toLowerCase().includes('meetar'),
    `Got: ${fallbackStandard}`
  );
});

test('detectKannadaVoice accurately detects native voice or recommends phonetic fallback with user notification', async () => {
  const { detectKannadaVoice, speakKannada, getSpeechEngineStatus } = await import('./speech.js');

  // Case 1: Environment with native Kannada voice (kn-IN)
  const mockVoicesWithKannada = [
    { name: 'Google Kannada', lang: 'kn-IN', voiceURI: 'kn-in-google' } as unknown as SpeechSynthesisVoice,
    { name: 'Google US English', lang: 'en-US', voiceURI: 'en-us-google' } as unknown as SpeechSynthesisVoice,
  ];
  const detectedNative = detectKannadaVoice(mockVoicesWithKannada);
  assert.equal(detectedNative.hasNativeVoice, true);
  assert.equal(detectedNative.kannadaVoice?.name, 'Google Kannada');
  assert.equal(detectedNative.warningNotice, undefined);

  // Case 2: Environment with no native Kannada voice, but has Indian English
  const mockVoicesWithoutKannada = [
    { name: 'Microsoft Heera - English (India)', lang: 'en-IN', voiceURI: 'en-in-heera' } as unknown as SpeechSynthesisVoice,
    { name: 'Microsoft David - English (United States)', lang: 'en-US', voiceURI: 'en-us-david' } as unknown as SpeechSynthesisVoice,
  ];
  const detectedFallback = detectKannadaVoice(mockVoicesWithoutKannada);
  assert.equal(detectedFallback.hasNativeVoice, false);
  assert.equal(detectedFallback.recommendedVoice?.lang, 'en-IN');
  assert.ok(detectedFallback.warningNotice);
  assert.ok(detectedFallback.warningNotice.includes('No native Kannada voice engine detected'));

  // Case 3: Empty speech text handling
  let errorMsg = '';
  const emptyResult = await speakKannada('   ', {
    onError: (err) => { errorMsg = err; }
  });
  assert.equal(emptyResult.success, false);
  assert.ok(errorMsg.length > 0);

  // Case 4: Node.js environment engine status check (speechSynthesis undefined in node)
  const engineStatus = getSpeechEngineStatus();
  assert.equal(engineStatus.isSupported, false);
  assert.ok(engineStatus.warningNotice);
});


