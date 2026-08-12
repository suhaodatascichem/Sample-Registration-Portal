"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Volume2, Sparkles, Plus, AlertCircle, Save, Loader2, ArrowRight } from "lucide-react";
import TextIntake from "@/components/TextIntake";
import AudioRecorder from "@/components/AudioRecorder";
import PhotoScanner from "@/components/PhotoScanner";
import SampleGrid from "@/components/SampleGrid";
import { api, ExtractedBatch } from "@/utils/api";

export default function IntakeDashboard() {
  const router = useRouter();
  
  const [companyName, setCompanyName] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [textIntakeValue, setTextIntakeValue] = useState("");
  const [voiceCount, setVoiceCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [rowData, setRowData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset sequence counters when text is completely cleared
  React.useEffect(() => {
    if (!textIntakeValue.trim()) {
      setVoiceCount(0);
      setPhotoCount(0);
    }
  }, [textIntakeValue]);

  // Callback when Voice Intake transcribes and formats regional speech
  const handleVoiceTranscription = (transcriptText: string) => {
    setErrorMsg(null);
    const nextCount = voiceCount + 1;
    setVoiceCount(nextCount);
    const entry = `Voice ${nextCount} (${transcriptText})`;
    setTextIntakeValue((prev) => (prev.trim() ? `${prev}\n\n${entry}` : entry));
  };

  // Callback when Upload Files performs OCR/Vision processing on PDFs or images
  const handlePhotoOCR = (ocrText: string, isPdf?: boolean) => {
    setErrorMsg(null);
    const nextCount = photoCount + 1;
    setPhotoCount(nextCount);
    const tag = isPdf ? `PDF Document ${nextCount}` : `Uploaded Image ${nextCount}`;
    const entry = `${tag} (${ocrText})`;
    setTextIntakeValue((prev) => (prev.trim() ? `${prev}\n\n${entry}` : entry));
  };

  // Callback when AI extracts a batch from text intake notes
  const handleAIExtraction = (data: ExtractedBatch) => {
    setErrorMsg(null);
    if (data.customer_name) {
      setCompanyName(data.customer_name);
    }
    
    // Convert extracted samples into row data format
    const newRows = data.samples.map((s) => ({
      mac_no: s.mac_no || "",
      customer_name: s.customer_name || data.customer_name || companyName || "",
      material_code: s.material_code || "OTHER",
      sample_description: s.sample_description || "",
      test_total_aa: s.test_total_aa,
      test_supp_aa: s.test_supp_aa,
      test_nir: s.test_nir,
      test_trp: s.test_trp,
      test_gaa: s.test_gaa,
      test_tdf: s.test_tdf,
      contact_person: s.contact_person || "Sheila"
    }));

    // Append to existing rows
    setRowData((prev) => [...prev, ...newRows]);
  };

  const handleManualError = (error: string) => {
    setErrorMsg(error);
  };

  const handleSaveDraft = async () => {
    if (!companyName.trim()) {
      setErrorMsg("Please enter a company / customer name to create a batch.");
      return;
    }
    if (rowData.length === 0) {
      setErrorMsg("Please add at least one sample row before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      // 1. Map row data to the API sample creation payload
      const samplesPayload = rowData.map((row) => ({
        mac_no: row.mac_no || "",
        material_code: row.material_code || "OTHER",
        sample_description: row.sample_description || "Unnamed sample",
        test_total_aa: !!row.test_total_aa,
        test_supp_aa: !!row.test_supp_aa,
        test_nir: !!row.test_nir,
        test_trp: !!row.test_trp,
        test_gaa: !!row.test_gaa,
        test_tdf: !!row.test_tdf,
        contact_person: row.contact_person || "Sheila"
      }));

      // 2. Call backend draft batch creation API
      const batch = await api.createBatch(companyName, "", submitterName, samplesPayload);
      
      // 3. Route to the review page
      router.push(`/review?batch_id=${batch.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save draft batch.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 font-inter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">
            Sample Intake & Registration
          </h1>
        </div>
      </div>

      {/* Top Banner: Primary Batch Identification Details */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Customer / Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Japfa Indonesia"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-slate-100 placeholder-slate-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Submitter Name / Email
            </label>
            <input
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="e.g. Sheila (sheila@example.com)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-slate-100 placeholder-slate-500 text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AI Multimodal 2-Step Intake Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Step 1 (Left Side - Col 5): Voice Intake & Photo Scanner */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <AudioRecorder 
            onTranscriptionSuccess={handleVoiceTranscription} 
            onError={handleManualError} 
          />
          
          <PhotoScanner 
            onOCRSuccess={handlePhotoOCR} 
            onError={handleManualError} 
          />
        </div>

        {/* Step 2 (Right Side - Col 7): Text Intake (Primary Review & Extraction Window) */}
        <div className="lg:col-span-7 flex flex-col">
          <TextIntake 
            textValue={textIntakeValue}
            setTextValue={setTextIntakeValue}
            onExtractionSuccess={handleAIExtraction} 
            onError={handleManualError} 
          />
        </div>
      </div>

      {/* Worksheet & AG Grid Interface */}
      <div className="glass-panel rounded-3xl p-6 shadow-2xl relative">
        <SampleGrid 
          rowData={rowData} 
          setRowData={setRowData} 
          defaultMacNo=""
          defaultContactPerson="Sheila"
        />
        
        {/* Navigation Action Footer */}
        <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-6">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-xl shadow-brand-600/10 hover:shadow-brand-600/25 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Proceed to Review
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
