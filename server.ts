import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper: safe JSON parsing
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// 1. Endpoint: Batch Transliteration & Translation
app.post('/api/gemini/translate', async (req: Request, res: Response) => {
  try {
    const { phrases, targetLanguage, scriptName } = req.body;
    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({ error: 'phrases array is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on server',
        fallback: true,
      });
    }

    const prompt = `You are an expert Kannada linguist helping non-Kannada speakers learn Kannada through their native language: ${targetLanguage} (${scriptName} script).
Given the following Kannada phrases and English meanings, generate:
1. "transliteration": the phonetic pronunciation written strictly in the ${scriptName} script (how a ${targetLanguage} native would read the Kannada sound).
2. "meaning": the natural translation in ${targetLanguage} language.

Phrases:
${JSON.stringify(phrases, null, 2)}

Respond with a JSON array of objects with keys: "id", "kannada", "transliteration", "meaning".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(cleanJsonOutput(response.text || '[]'));
    return res.json({ results: parsed });
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to translate phrases',
      fallback: true,
    });
  }
});

// 2. Endpoint: Roleplay Chat
app.post('/api/gemini/roleplay', async (req: Request, res: Response) => {
  try {
    const { scenarioId, scenarioTitle, roleName, history, userMessage, targetLanguage, scriptName } = req.body;

    if (!ai) {
      // Intelligent offline fallback response
      const fallbackReplies: Record<string, any> = {
        hospital: {
          kannada: 'ಹೌದು, ಡಾಕ್ಟರ್ 11 ಗಂಟೆಗೆ ಸಿಗ್ತಾರೆ. ನೀವು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ತಗೊಂಡಿದ್ದೀರಾ?',
          transliteration: targetLanguage === 'Hindi' ? 'हाँ, डॉक्टर 11 गंटेगे सिगत्तारे. नीवु अपॉइंटमेंट तगोंडिद्दीरा?' : 'Haudu, doctor 11 gantege sigtaare. Neevu appointment tagondiddira?',
          translation: 'Yes, the doctor is available at 11 AM. Have you taken an appointment?',
          correction: 'Your sentence was clear! In Kannada, "Enu samasye?" means "What is the problem?".',
          quickReplies: ['ಹೌದು, ತಗೊಂಡಿದ್ದೀನಿ (Yes, I have taken)', 'ಇಲ್ಲ, ಈಗ ತಗೋಬೇಕು (No, I need to take now)'],
        },
        travel: {
          kannada: 'ಬನ್ನಿ ಸರ್, ಮೀಟರ್ ಹಾಕ್ತೀನಿ. ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು?',
          transliteration: targetLanguage === 'Hindi' ? 'बन्नी सर, मीटर हाक्तिनी. एल्लिगे होग्बेकु?' : 'Banni sir, meter haaktini. Ellige hogbeku?',
          translation: 'Come sir, I will put the meter. Where do you want to go?',
          correction: 'Good attempt! Say "Meter haaki" politely to ask for meter fare.',
          quickReplies: ['ಇಂದಿರಾನಗರಕ್ಕೆ ಹೋಗ್ಬೇಕು (Need to go to Indiranagar)', 'ಎಷ್ಟು ಚಾರ್ಜ್ ಆಗುತ್ತೆ? (How much charge?)'],
        },
        shopping: {
          kannada: 'ಟೊಮ್ಯಾಟೊ ಕೆಜಿಗೆ 40 ರೂಪಾಯಿ ಸರ್. ಎಷ್ಟು ಕೆಜಿ ಬೇಕು?',
          transliteration: targetLanguage === 'Hindi' ? 'टोमॅटो केजिगे 40 रूपायि सर. एष्टु केजि बेकु?' : 'Tomato kg-ge 40 roopaayi sir. Eshtu kg beku?',
          translation: 'Tomato is 40 rupees per kg sir. How many kg do you need?',
          correction: 'To bargain gently, you can say: "Swalpa kammi maadi" (Reduce a little bit).',
          quickReplies: ['ಎರಡು ಕೆಜಿ ಕೊಡಿ (Give two kg)', 'ಸ್ವಲ್ಪ ಕಮ್ಮಿ ಮಾಡಿ (Reduce a little bit)'],
        },
      };

      const fb = fallbackReplies[scenarioId] || fallbackReplies.travel;
      return res.json(fb);
    }

    const systemInstruction = `You are playing the role of ${roleName} in Bengaluru/Karnataka for a real-world scenario: "${scenarioTitle}".
The user is a newcomer to Karnataka trying to speak and learn Kannada.
The user's native language is ${targetLanguage} (${scriptName} script).

Guidelines:
1. Reply in simple, natural, everyday spoken Kannada (1-2 short sentences max).
2. Provide phonetic transliteration in the user's native script (${scriptName}).
3. Provide the accurate translation in ${targetLanguage}.
4. Provide gentle feedback or correction if the user made a language/grammar mistake or suggest a more colloquial Kannada idiom. If user spoke in Hindi/English, teach how to say it in Kannada.
5. Provide 2 short, helpful quick-reply options in Kannada with ${targetLanguage} or English gloss.
6. Maintain a warm, encouraging, authentic Bengaluru local tone.

Respond in strict JSON with keys:
- "kannada": string (Kannada script)
- "transliteration": string (in ${scriptName} script)
- "translation": string (in ${targetLanguage})
- "correction": string (gentle coaching tip in ${targetLanguage})
- "quickReplies": array of 2 strings (short Kannada reply + translation)`;

    const conversationContext = (history || [])
      .map((m: any) => `${m.role === 'user' ? 'User' : roleName}: ${m.text}`)
      .join('\n');

    const prompt = `Conversation history:
${conversationContext}

User just said: "${userMessage}"

Respond as ${roleName} in the required JSON structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(cleanJsonOutput(response.text || '{}'));
    return res.json(parsed);
  } catch (error: any) {
    console.error('Roleplay error:', error);
    return res.status(500).json({
      error: error.message || 'Roleplay request failed',
      kannada: 'ಹೌದು, ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಮುಂದುವರಿಸಿ!',
      transliteration: 'Haudu, naanu artha maadikonnde. Munduvarisi!',
      translation: 'Yes, I understood. Please continue!',
      correction: 'Network glitch, but you are doing great! Keep practicing.',
      quickReplies: ['ಧನ್ಯವಾದ (Thank you)', 'ಮತ್ತೆ ಹೇಳಿ (Say again)'],
    });
  }
});

// 3. Endpoint: Native-Language Bridge (Cognates / Etymology)
app.post('/api/gemini/bridge', async (req: Request, res: Response) => {
  try {
    const { targetLanguage, category } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const prompt = `You are a comparative Indian linguist. For someone who speaks ${targetLanguage}, generate 6 fascinating bridge words (cognates or shared roots) between Kannada and ${targetLanguage}.
For Indo-Aryan languages (Hindi, Marathi, Bengali), highlight Tatsama/Tadbhav Sanskrit cognates (like Namaskara, Samaya, Vidyarthi, Chikitsa, Sahaya, Mitra, Shanti, Bhojana, Pustaka).
For Dravidian languages (Telugu, Tamil), highlight shared proto-Dravidian roots and grammatical parallels (like Neeru/Neellu, Mane/Veedu, Halu/Paalu, Belakku/Velicham, Baa/Vaa, Kodu/Kodu).

Category or focus: ${category || 'everyday life, health, market, polite society'}.

Output a JSON array of objects with keys:
- "kannadaWord": string (in Kannada script)
- "kannadaTranslit": string (phonetic pronunciation)
- "nativeWord": string (the similar word in ${targetLanguage} script)
- "meaning": string (meaning in English / ${targetLanguage})
- "connectionType": string (e.g. "Sanskrit Cognate" or "Shared Dravidian Root" or "Colloquial Borrowing")
- "explanation": string (short 1-sentence note showing how easy it is to remember)
- "exampleSentence": string (a practical Kannada sentence using this word with translation)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(cleanJsonOutput(response.text || '[]'));
    return res.json({ bridgeWords: parsed });
  } catch (error: any) {
    console.error('Bridge error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate bridge words' });
  }
});

// 4. Endpoint: Custom Phrase Generator ("How do I say X in Kannada?")
app.post('/api/gemini/custom-phrase', async (req: Request, res: Response) => {
  try {
    const { query, targetLanguage, scriptName } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const prompt = `The user wants to express: "${query}" in Kannada.
Their native language is ${targetLanguage} (${scriptName} script).

Provide:
1. "kannada": natural spoken Kannada phrase (Bengaluru colloquial)
2. "transliteration": in ${scriptName} script
3. "englishTranslit": in Latin/English script
4. "meaning": exact meaning in ${targetLanguage}
5. "literalMeaning": breakdown of key words (e.g. "beku = want, illi = here")
6. "usageTip": 1 short cultural or situational tip on when/how to say it politely.

Respond in strict JSON with these keys.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(cleanJsonOutput(response.text || '{}'));
    return res.json(parsed);
  } catch (error: any) {
    console.error('Custom phrase error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate custom phrase' });
  }
});

// 5. Endpoint: Transcribe Audio using model "gemini-3.5-transcribe"
app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on server',
        fallback: true,
        transcription: 'ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ? (Namaskaara, hegiddeera?)',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    };

    const promptPart = {
      text: 'Transcribe this spoken audio accurately. The speaker might be speaking Kannada, Hindi, or English. Output only the exact transcribed text, along with its English transliteration if spoken in Kannada.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, promptPart] },
    });

    const transcription = response.text?.trim() || '';
    return res.json({ transcription });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return res.status(500).json({
      error: error.message || 'Audio transcription failed',
      fallback: true,
      transcription: 'ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡ್ತೀರಾ? (Swalpa sahaaya maadtiraa?)',
    });
  }
});

// 6. Endpoint: Multi-Turn Gemini Chatbot with specific roles and tiered models
// Models: gemini-4-argon (complex), gemini-3.8-flash (general), gemini-3.1-flash-lite (fast)
app.post('/api/gemini/chatbot', async (req: Request, res: Response) => {
  try {
    const {
      roleId = 'tutor',
      messages = [],
      userMessage,
      targetLanguage = 'Hindi',
      taskComplexity = 'general', // 'fast' | 'general' | 'complex'
    } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    // Role-specific System Instructions
    const roleInstructions: Record<string, string> = {
      tutor: `You are Master Ananth, a revered, kind, and patient Kannada teacher in Bengaluru.
Your mission is to help people living in Karnataka learn Kannada through their native language (${targetLanguage}).
Always explain Kannada grammar, vocabulary, and daily expressions with warmth.
Format your responses with:
1. Natural Kannada phrases (in Kannada script).
2. Phonetic pronunciation in Latin and in the user's native script.
3. Natural translation and gentle cultural insights about Bengaluru and Karnataka culture.
Keep your answers educational, scannable, and encouraging.`,

      local_buddy: `You are Chetan, a cheerful, street-smart 26-year-old Bengaluru techie & localite.
You teach conversational Kannada, local slang (like "Macha", "Guru", "Swalpa adjust maadi", "Sakkath"), and how to get things done with auto drivers, darshinis, landlords, and coworkers.
Tone: Energetic, friendly, full of local Bengaluru flavor.
Explain expressions clearly with ${targetLanguage} equivalents.`,

      grammar_expert: `You are Dr. Shanthamma, an expert linguist and professor of classical and modern Kannada.
You explain intricate grammatical rules: Vibhakti Pratyaya (case endings), Sandhi, Samasa, verb tenses, and formal vs informal honorific distinctions.
Compare Kannada linguistic constructs with ${targetLanguage} (e.g. Sanskrit roots or Dravidian morphology).
Be precise, structured, and helpful.`,
    };

    const systemInstruction = roleInstructions[roleId] || roleInstructions.tutor;

    // Model selection based on user request:
    // gemini-4-argon for complex tasks, gemini-3.8-flash for general, gemini-3.1-flash-lite for fast
    let selectedModel = 'gemini-3.8-flash';
    if (taskComplexity === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (taskComplexity === 'complex') {
      selectedModel = 'gemini-4-argon';
    }

    if (!ai) {
      return res.json({
        reply: `ನಮಸ್ಕಾರ! (Hello in Kannada). You asked: "${userMessage}". In Kannada, we greet warmly with "Namaskara" and show respect using the plural suffix "-ri" or "-are". Keep asking!`,
        modelUsed: selectedModel,
        roleId,
      });
    }

    // Prepare multi-turn history
    const contents: any[] = [];
    for (const msg of messages.slice(-10)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
        },
      });
    } catch (modelError: any) {
      // If gemini-4-argon requires paid key or fails, gracefully fallback to gemini-3.8-flash
      if (selectedModel === 'gemini-4-argon') {
        console.warn('Falling back from gemini-4-argon to gemini-3.8-flash');
        selectedModel = 'gemini-3.8-flash';
        response = await ai.models.generateContent({
          model: selectedModel,
          contents,
          config: { systemInstruction },
        });
      } else {
        throw modelError;
      }
    }

    return res.json({
      reply: response.text || 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಹಾಯಕ್ಕೆ ಇಲ್ಲಿದ್ದೇನೆ.',
      modelUsed: selectedModel,
      roleId,
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      error: error.message || 'Chatbot request failed',
      reply: 'ಹೌದು, ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಕೇಳಿ! (Yes, I understood. Please feel free to ask again!)',
      modelUsed: 'gemini-3.8-flash',
    });
  }
});

// Server-side cache for synthesized speech audio to eliminate duplicate Gemini API calls
// and stay well within Free Tier rate limits (3 requests per minute).
const serverTtsCache = new Map<string, string>();
const MAX_SERVER_CACHE_ITEMS = 600;

// 7. Endpoint: High-fidelity Kannada Text-To-Speech using Gemini 3.8 Flash Lite TTS
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({ error: 'text is empty' });
    }

    // 1. Check in-memory server cache first (0ms latency, zero Gemini quota consumption)
    if (serverTtsCache.has(trimmedText)) {
      return res.json({
        audioBase64: serverTtsCache.get(trimmedText),
        mimeType: 'audio/wav',
        cached: true,
      });
    }

    if (!ai) {
      return res.json({
        audioBase64: null,
        fallback: true,
        message: 'Gemini API not configured on server. Using client speech synthesis.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: 'Clear, polite, authentic spoken Kannada pronunciation at a comfortable speaking pace for learners',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({
        audioBase64: null,
        fallback: true,
        message: 'No audio returned from Gemini TTS. Using fallback speech.',
      });
    }

    // Store in cache (LRU eviction if over capacity)
    if (serverTtsCache.size >= MAX_SERVER_CACHE_ITEMS) {
      const oldestKey = serverTtsCache.keys().next().value;
      if (oldestKey) serverTtsCache.delete(oldestKey);
    }
    serverTtsCache.set(trimmedText, base64Audio);

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      cached: false,
    });
  } catch (error: any) {
    const errorMsg = String(error?.message || error?.details || error || '');
    const isRateLimit =
      error?.status === 429 ||
      error?.code === 429 ||
      errorMsg.includes('429') ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('Quota exceeded');

    if (isRateLimit) {
      // Free tier has a 3 requests/minute quota limit.
      // Gracefully instruct client to fall back to speech synthesis without throwing or logging console.error.
      console.warn('[Gemini TTS] Free tier quota limit reached (3 RPM). Instructing client to use speech synthesis fallback.');
      return res.status(200).json({
        audioBase64: null,
        rateLimited: true,
        fallback: true,
        message: 'Gemini TTS rate limited (3 RPM). Using client speech synthesis.',
      });
    }

    console.warn('[Gemini TTS] Synthesis unavailable, instructing client fallback:', errorMsg.slice(0, 160));
    return res.status(200).json({
      audioBase64: null,
      fallback: true,
      error: 'TTS generation unavailable',
    });
  }
});


// Serve Vite dev server or static build
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kannada Saathi server running on http://localhost:${PORT}`);
  });
}

startServer();
