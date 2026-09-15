import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Clock,
  Mic,
  RefreshCw,
} from 'lucide-react';
import { AudioNarrationResult } from '../types';

interface NarratedClipPlayerProps {
  narrationText: string;
  audioResult: AudioNarrationResult | null;
  landmarkName: string;
  selectedVoice: string;
  onRegenerateVoice?: (voiceName: string) => void;
  isRegeneratingAudio?: boolean;
}

export const NarratedClipPlayer: React.FC<NarratedClipPlayerProps> = ({
  narrationText,
  audioResult,
  landmarkName,
  selectedVoice,
  onRegenerateVoice,
  isRegeneratingAudio = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Split narration text into sentences for synchronized teleprompter
  const sentences = React.useMemo(() => {
    if (!narrationText) return [];
    return narrationText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [narrationText]);

  // Estimate active sentence based on audio progress
  const activeSentenceIndex = React.useMemo(() => {
    if (!sentences.length || duration <= 0) return 0;
    const progress = currentTime / duration;
    const index = Math.min(
      Math.floor(progress * sentences.length),
      sentences.length - 1
    );
    return Math.max(0, index);
  }, [currentTime, duration, sentences.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 18);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioResult]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio && audioResult?.audioDataUrl) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback blocked or failed, using SpeechSynthesis fallback:', err);
            speakFallback();
          });
      }
    } else {
      // Fallback to browser Web Speech API
      speakFallback();
    }
  };

  const speakFallback = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(narrationText);
        utterance.rate = playbackRate;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true));
    } else {
      speakFallback();
    }
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 0.9 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
      {/* Hidden audio element */}
      {audioResult?.audioDataUrl && (
        <audio
          ref={audioRef}
          src={audioResult.audioDataUrl}
          preload="auto"
        />
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Radio className={`w-5 h-5 ${isPlaying ? 'animate-pulse text-slate-950' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">
                AR Audio Tour Guide
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                TTS: {audioResult?.voiceName || selectedVoice}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Narrated clip for <span className="text-amber-300 font-semibold">{landmarkName}</span>
            </p>
          </div>
        </div>

        {/* Audio voice switcher & refresh */}
        {onRegenerateVoice && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Voice:</span>
            <select
              value={selectedVoice}
              disabled={isRegeneratingAudio}
              onChange={(e) => onRegenerateVoice(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="Kore">Kore (Warm)</option>
              <option value="Puck">Puck (Energetic)</option>
              <option value="Fenrir">Fenrir (Historian)</option>
              <option value="Zephyr">Zephyr (Serene)</option>
            </select>

            <button
              onClick={() => onRegenerateVoice(selectedVoice)}
              disabled={isRegeneratingAudio}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Regenerate narration with this voice"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingAudio ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Synchronized Teleprompter Subtitle Box */}
      <div className="relative bg-slate-950/80 rounded-xl p-4 sm:p-5 border border-slate-800 mb-5 min-h-[110px] flex flex-col justify-center">
        <div className="absolute top-2.5 right-3 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
          LIVE TRANSCRIPT
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-slate-300 font-serif">
          {sentences.map((sentence, idx) => {
            const isActive = isPlaying && idx === activeSentenceIndex;
            return (
              <span
                key={idx}
                className={`transition-colors duration-200 mr-1.5 ${
                  isActive
                    ? 'text-amber-300 font-semibold bg-amber-500/20 px-1 rounded'
                    : 'hover:text-white cursor-pointer'
                }`}
                onClick={() => {
                  if (duration > 0 && audioRef.current) {
                    const targetTime = (idx / sentences.length) * duration;
                    audioRef.current.currentTime = targetTime;
                    setCurrentTime(targetTime);
                  }
                }}
              >
                {sentence}
              </span>
            );
          })}
        </p>
      </div>

      {/* Waveform Equalizer Simulation Bars */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-8 mb-4 px-2">
        {Array.from({ length: 28 }).map((_, i) => {
          // Dynamic height based on playback state
          const height = isPlaying
            ? Math.max(15, Math.sin((i + currentTime * 8) * 0.7) * 90 + 20)
            : 15 + ((i * 7) % 25);
          return (
            <div
              key={i}
              className={`w-1 sm:w-1.5 rounded-full transition-all duration-100 ${
                isPlaying ? 'bg-amber-400' : 'bg-slate-700'
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Scrubber timeline */}
      <div className="space-y-1.5 mb-4">
        <input
          type="range"
          min={0}
          max={duration || 30}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {formatTime(duration || 25)}
          </span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between pt-1">
        {/* Playback speed toggle */}
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold border border-slate-700 transition-colors"
          title="Change playback speed"
        >
          {playbackRate}x
        </button>

        {/* Primary Play/Pause Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReplay}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Replay from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="play-narration-btn"
            onClick={togglePlay}
            disabled={isRegeneratingAudio}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            title={isPlaying ? 'Pause AR Audio Guide' : 'Play AR Audio Guide'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Model badge */}
        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
          Gemini 3.1 Flash TTS
        </div>
      </div>
    </div>
  );
};
