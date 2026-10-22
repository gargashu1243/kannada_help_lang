import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Loader2,
  X,
  Volume2,
  Sparkles,
  Check,
  Send,
  AlertCircle,
} from 'lucide-react';
import { speakKannada } from '../utils/speech';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionComplete?: (text: string) => void;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onTranscriptionComplete,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscribedText(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(timerIntervalRef.current);
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleSendAudio(audioBlob, mimeType);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMessage(
        'Could not access microphone. Please ensure microphone permissions are granted.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const response = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type || mimeType,
          }),
        });

        if (!response.ok) {
          throw new Error('Transcription failed on server');
        }

        const data = await response.json();
        setTranscribedText(data.transcription || '');
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Failed to transcribe audio with Gemini 3.5');
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-amber-200 overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="transcribe-modal-title"
      >
        <div className="h-1.5 w-full karnataka-flag-bar" />

        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 id="transcribe-modal-title" className="font-bold text-stone-900 text-base">
                Voice Input (Gemini 3.5 Transcribe)
              </h3>
              <p className="text-xs text-stone-500">
                Speak in Kannada, Hindi, or English
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close transcribe modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          {/* Recording pulse button */}
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all relative z-10 ${
                isRecording
                  ? 'bg-stone-900 hover:bg-black scale-105'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <Square className="w-8 h-8 fill-white" />
              ) : isTranscribing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div>
            {isRecording ? (
              <div className="space-y-1">
                <div className="text-sm font-bold text-red-600 flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span>Recording... {recordingSeconds}s</span>
                </div>
                <p className="text-xs text-stone-500">
                  Tap the black square button to stop and transcribe.
                </p>
              </div>
            ) : isTranscribing ? (
              <div className="text-sm font-bold text-stone-700 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Transcribing with gemini-3.5-transcribe...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm font-bold text-stone-800">
                  Tap microphone to speak
                </div>
                <p className="text-xs text-stone-500">
                  Try saying "Namaskara", "Meter haaki sir", or any phrase!
                </p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Transcribed Output */}
          {transcribedText && (
            <div className="w-full text-left p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Transcribed Text
                </span>
                <button
                  onClick={() => speakKannada(transcribedText)}
                  className="p-1 text-stone-500 hover:text-stone-800"
                  title="Listen"
                  aria-label="Listen to transcription"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-lg font-bold font-kannada text-stone-900">
                {transcribedText}
              </div>

              {onTranscriptionComplete && (
                <button
                  onClick={() => {
                    onTranscriptionComplete(transcribedText);
                    onClose();
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Insert into Message</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
