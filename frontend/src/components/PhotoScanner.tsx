"use client";

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import { api, ExtractedBatch } from "@/utils/api";

interface PhotoScannerProps {
  onExtractionSuccess: (data: ExtractedBatch) => void;
  onError: (error: string) => void;
}

export default function PhotoScanner({ onExtractionSuccess, onError }: PhotoScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = async (file: File) => {
    // Check if it's actually an image
    if (!file.type.startsWith("image/")) {
      onError("Please upload an image file (PNG, JPG, or JPEG).");
      return;
    }

    setFileName(file.name);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsProcessing(true);
    try {
      const data = await api.processPhoto(file);
      onExtractionSuccess(data);
    } catch (err: any) {
      onError(err.message || "Failed to parse sample sheet image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-panel glass-panel-glow rounded-3xl p-6 flex flex-col items-center justify-between min-h-[220px] transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-brand-500/10 border-bl border-white/5 rounded-bl-xl">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Multimodal Vision
      </div>

      <div className="w-full text-center mt-2">
        <h3 className="text-lg font-semibold text-slate-100 font-outfit">Photo Intake</h3>
        <p className="text-xs text-slate-400 mt-1">
          Scan paper manifests, handwritten logs, or sample label photos.
        </p>
      </div>

      <div className="w-full my-4 flex-grow flex items-center justify-center">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <div className="text-center">
              <span className="text-sm font-semibold text-brand-300">AI scanning manifest image...</span>
              <p className="text-[10px] text-slate-500 mt-1">Transcribing tables and handwriting</p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="relative w-full max-w-[240px] aspect-[4/3] rounded-xl overflow-hidden border border-white/10 group shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={previewUrl} 
              alt="Scan Preview" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs text-white font-semibold truncate px-4 max-w-[80%]">{fileName}</span>
            </div>
            <button 
              onClick={removeFile}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-950 text-slate-300 hover:text-white transition-all shadow-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerInput}
            className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? "border-brand-400 bg-brand-500/10 scale-[0.99]" 
                : "border-white/10 hover:border-brand-500/40 hover:bg-white/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple={false}
              accept="image/*"
              onChange={handleChange}
            />
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-300 text-center">
              Drag & drop or <span className="text-brand-400 hover:text-brand-300">browse files</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Supports JPEG, PNG up to 10MB</p>
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}
