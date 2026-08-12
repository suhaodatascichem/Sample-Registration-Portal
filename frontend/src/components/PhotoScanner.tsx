"use client";

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, FileText, Loader2, Sparkles, X } from "lucide-react";
import { api } from "@/utils/api";

interface PhotoScannerProps {
  onOCRSuccess: (text: string, isPdf: boolean, fileName?: string) => void;
  onError: (error: string) => void;
}

export default function PhotoScanner({ onOCRSuccess, onError }: PhotoScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPdfFile, setIsPdfFile] = useState(false);

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
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      onError("Please upload a PDF document or image file (PNG, JPG, JPEG).");
      return;
    }

    setFileName(file.name);
    setIsPdfFile(isPdf);
    
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    setIsProcessing(true);
    try {
      const result = await api.ocrPhoto(file);
      onOCRSuccess(result.text, isPdf, file.name);
    } catch (err: any) {
      onError(err.message || "Failed to parse uploaded file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setPreviewUrl(null);
    setFileName(null);
    setIsPdfFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-panel glass-panel-glow rounded-3xl p-6 flex flex-col items-center justify-between min-h-[220px] transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-brand-500/10 border-bl border-white/5 rounded-bl-xl">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Vision LLM
      </div>

      <div className="w-full text-center mt-2">
        <h3 className="text-lg font-semibold text-slate-100 font-outfit">Upload Files</h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload multi-page PDFs or photos directly into Text Intake.
        </p>
      </div>

      <div className="w-full my-4 flex-grow flex items-center justify-center">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <div className="text-center">
              <span className="text-sm font-semibold text-brand-300">AI reading file...</span>
              <p className="text-[10px] text-slate-500 mt-1">Scanning pages, tables, and invoice data</p>
            </div>
          </div>
        ) : fileName ? (
          <div className="relative w-full max-w-[240px] p-4 rounded-xl border border-white/10 bg-slate-950/80 flex flex-col items-center justify-center gap-2 group shadow-md">
            {isPdfFile ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <FileText className="w-8 h-8" />
              </div>
            ) : previewUrl ? (
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewUrl} 
                  alt="Scan Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <span className="text-xs text-slate-200 font-semibold truncate max-w-full px-2">{fileName}</span>
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
              accept="image/*,application/pdf,.pdf"
              onChange={handleChange}
            />
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-3 group-hover:scale-110 transition-transform flex gap-2 text-slate-400">
              <Upload className="w-5 h-5" />
              <FileText className="w-5 h-5 text-red-400/70" />
            </div>
            <p className="text-xs font-semibold text-slate-300 text-center">
              Drag & drop or <span className="text-brand-400 hover:text-brand-300">browse files</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Supports PDF (multi-page), JPEG, PNG up to 20MB</p>
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}
