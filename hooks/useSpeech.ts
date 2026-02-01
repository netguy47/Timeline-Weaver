
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Global shared context to manage audio hardware efficiently
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioContext;
};

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const queueRef = useRef<string[]>([]);
  const isAmbientRef = useRef<boolean>(false);
  const soundscapeRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const trace = (msg: string, data?: any) => {
    console.log(`[Chronos-Audio-Trace] ${msg}`, data || '');
  };

  const cleanup = useCallback(() => {
    trace('Cleaning up audio resources...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (sourceNodeRef.current) {
      try { 
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop(); 
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsPreparing(false);
    setCurrentIndex(0);
    setTotalChunks(0);
    queueRef.current = [];
  }, []);

  const playChunk = useCallback(async (index: number, retryCount = 0): Promise<void> => {
    const ctx = getAudioContext();
    
    // Ensure context is running (fixes browser autoplay restrictions)
    if (ctx.state === 'suspended') {
      trace('Audio context suspended, attempting resume...');
      await ctx.resume();
    }

    if (index >= queueRef.current.length) {
      trace('Playback queue exhausted.');
      if (!isAmbientRef.current) cleanup();
      return;
    }

    setCurrentIndex(index);
    const text = queueRef.current[index].trim();
    
    if (!text && !isAmbientRef.current) {
      trace(`Skipping empty chunk at index ${index}`);
      return playChunk(index + 1);
    }

    trace(`Processing chunk ${index + 1}/${queueRef.current.length}`, { textLength: text.length });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let prompt = "";
      if (isAmbientRef.current) {
        prompt = `Generate a high-fidelity cinematic background soundscape: ${soundscapeRef.current}. NO SPEECH. Immersive foley only.`;
      } else {
        prompt = `NARRATION INSTRUCTION: Read the following precisely. Voice: Scholarly, deep, archival. Soundscape: ${soundscapeRef.current}.\n\nTEXT:\n${text}`;
      }

      trace(`Requesting TTS generation for node ${index}...`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio payload returned from Gemini.");

      trace(`Decoding audio payload for node ${index}...`);
      const audioBuffer = await decodeAudioData(
        decodeBase64(base64Audio),
        ctx,
        24000,
        1
      );

      trace(`Initializing playback for node ${index}. Duration: ${audioBuffer.duration.toFixed(2)}s`);
      const gainNode = ctx.createGain();
      gainNode.gain.value = isAmbientRef.current ? 0.35 : 1.0;
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      
      source.onended = () => {
        trace(`Node ${index} playback completed.`);
        if (!isPaused) {
          if (isAmbientRef.current) {
            playChunk(index); 
          } else {
            playChunk(index + 1);
          }
        }
      };

      source.start(0);
      sourceNodeRef.current = source;
      setIsSpeaking(true);
      setIsPreparing(false);

    } catch (error: any) {
      trace(`CRITICAL ERROR in node ${index}:`, error);
      
      const isRetryable = error.message?.includes("500") || error.message?.includes("INTERNAL") || error.message?.includes("fetch");
      if (isRetryable && retryCount < 2) {
        const backoff = 1000 * (retryCount + 1);
        trace(`Attempting retry ${retryCount + 1} for node ${index} after ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
        return playChunk(index, retryCount + 1);
      }
      
      if (!isAmbientRef.current) {
        trace(`Node ${index} unrecoverable. Skipping to node ${index + 1} to preserve flow.`);
        return playChunk(index + 1);
      } else {
        cleanup();
      }
    }
  }, [cleanup, isPaused]);

  const speak = useCallback(async (text: string, soundscape: string, isAmbientOnly: boolean = false) => {
    trace('Initiating full narrative sequence...');
    cleanup();
    setIsPreparing(true);
    isAmbientRef.current = isAmbientOnly;
    soundscapeRef.current = soundscape;

    let chunks: string[] = [];
    if (isAmbientOnly) {
      chunks = ["AMBIENT_SOUNDSCAPE_NODE"];
    } else {
      // Improved chunking to handle the 1200+ word requirement without API timeouts
      const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed.length > 700) {
          const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [trimmed];
          let currentSubChunk = "";
          for (const s of sentences) {
            if ((currentSubChunk + s).length > 650) {
              if (currentSubChunk) chunks.push(currentSubChunk.trim());
              currentSubChunk = s;
            } else {
              currentSubChunk += s;
            }
          }
          if (currentSubChunk) chunks.push(currentSubChunk.trim());
        } else {
          chunks.push(trimmed);
        }
      }
    }

    trace(`Sequence decomposed into ${chunks.length} chunks.`);
    queueRef.current = chunks;
    setTotalChunks(chunks.length);
    playChunk(0);
  }, [cleanup, playChunk]);

  const pause = useCallback(() => {
    trace('Pausing playback...');
    if (sourceNodeRef.current && !isPaused) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      setIsPaused(true);
    }
  }, [isPaused]);

  const resume = useCallback(() => {
    trace('Resuming playback...');
    if (isPaused) {
      setIsPaused(false);
      playChunk(currentIndex);
    }
  }, [isPaused, currentIndex, playChunk]);

  const cancel = useCallback(() => {
    trace('Canceling playback sequence.');
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      trace('useSpeech hook unmounting, performing final cleanup.');
      cleanup();
    };
  }, [cleanup]);

  return { isSpeaking, isPaused, isPreparing, speak, pause, resume, cancel, currentIndex, totalChunks };
};
