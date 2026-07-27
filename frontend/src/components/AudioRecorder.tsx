"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Volume2, AlertCircle } from "lucide-react";
import { api, ExtractedBatch } from "@/utils/api";

interface AudioRecorderProps {
  onExtractionSuccess: (data: ExtractedBatch) => void;
  onError: (error: string) => void;
}

export default function AudioRecorder({ onExtractionSuccess, onError }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [visuals, setVisuals] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up timer and animations on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setDuration(0);
    setVisuals(new Array(30).fill(10));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Stop all audio tracks from stream to release mic icon
        stream.getTracks().forEach(track => track.stop());
        
        await handleAudioSubmit(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Simple voice waveform animation mock for standard user satisfaction
      const updateWaveform = () => {
        if (mediaRecorder.state === "recording") {
          setVisuals(() => 
            Array.from({ length: 30 }, () => Math.floor(Math.random() * 45) + 5)
          );
          animationFrameRef.current = requestAnimationFrame(updateWaveform);
        }
      };
      updateWaveform();

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      onError("Microphone access denied or not available. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const handleAudioSubmit = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const file = new File([blob], "recording.webm", { type: "audio/webm" });
      const data = await api.processAudio(file);
      onExtractionSuccess(data);
    } catch (err: any) {
      onError(err.message || "Failed to process audio registration.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="glass-panel glass-panel-glow rounded-3xl p-6 flex flex-col items-center justify-between min-h-[220px] transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-brand-500/10 border-bl border-white/5 rounded-bl-xl">
        <Volume2 className="w-3.5 h-3.5" /> Voice AI
      </div>

      <div className="w-full text-center mt-2">
        <h3 className="text-lg font-semibold text-slate-100 font-outfit">Voice Intake</h3>
        <p className="text-xs text-slate-400 mt-1">
          Record batch info: Customer name, materials, and tests requested.
        </p>
      </div>

      {/* Waveform / Visualizer */}
      <div className="h-16 w-full flex items-center justify-center gap-[3px] my-4 px-6">
        {isRecording ? (
          visuals.map((height, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-brand-600 to-purple-400 rounded-full transition-all duration-75"
              style={{ height: `${height}%` }}
            />
          ))
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            <span className="text-xs font-semibold text-brand-300 animate-pulse">Whisper transcribing...</span>
          </div>
        ) : (
          <p className="text-sm text-slate-500 font-medium">Click Record to describe samples orally</p>
        )}
      </div>

      {/* Recording Control Button */}
      <div className="flex items-center gap-4">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/20 transition-all transform hover:scale-105 active:scale-95"
          >
            <Square className="w-4 h-4 fill-white" />
            Stop ({formatTime(duration)})
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-brand-600 to-purple-500 hover:from-brand-500 hover:to-purple-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-xl shadow-brand-500/10 hover:shadow-brand-500/20 disabled:shadow-none transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-4 h-4" />
            Start Voice Intake
          </button>
        )}
      </div>
    </div>
  );
}
