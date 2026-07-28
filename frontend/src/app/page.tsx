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
  const [customerMacNo, setCustomerMacNo] = useState("");
  const [rowData, setRowData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Callback when AI extracts a batch from audio, photo, or text
  const handleAIExtraction = (data: ExtractedBatch) => {
    setErrorMsg(null);
    if (data.customer_name) {
      setCompanyName(data.customer_name);
    }
    if (data.customer_mac_no) {
      setCustomerMacNo(data.customer_mac_no);
    }
    
    // Convert extracted samples into row data format
    const newRows = data.samples.map((s) => ({
      mac_no: s.mac_no || data.customer_mac_no || customerMacNo || "",
      customer_name: s.customer_name || data.customer_name || companyName || "",
      material_code: s.material_code || "OTHER",
      sample_description: s.sample_description || "",
      test_total_aa: s.test_total_aa,
      test_supp_aa: s.test_supp_aa,
      test_nir: s.test_nir,
      test_trp: s.test_trp,
      test_gaa: s.test_gaa,
      contact_person: s.contact_person || submitterName || "Sheila"
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
        mac_no: row.mac_no || customerMacNo || "",
        material_code: row.material_code || "OTHER",
        sample_description: row.sample_description || "Unnamed sample",
        test_total_aa: !!row.test_total_aa,
        test_supp_aa: !!row.test_supp_aa,
        test_nir: !!row.test_nir,
        test_trp: !!row.test_trp,
        test_gaa: !!row.test_gaa,
        contact_person: row.contact_person || submitterName || "Sheila"
      }));

      // 2. Call backend draft batch creation API
      const batch = await api.createBatch(companyName, customerMacNo, submitterName, samplesPayload);
      
      // 3. Route to the review page
      router.push(`/review?batch_id=${batch.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save draft batch.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 font-inter">
      {/* Welcome Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent font-outfit">
            Samples Information
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Register new samples quickly using text, voice recordings, scanner sheets, or spreadsheet grids.
          </p>
        </div>
        
        {/* Customer & Mac No Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1.5 min-w-[180px] w-full sm:w-auto">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Smith Farms Ltd"
              className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-white text-sm font-semibold transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-[160px] w-full sm:w-auto">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Submitter Name
            </label>
            <input
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="e.g. John Doe"
              className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-white text-sm font-semibold transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-[160px] w-full sm:w-auto">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Customer Mac. no
            </label>
            <input
              type="text"
              value={customerMacNo}
              onChange={(e) => setCustomerMacNo(e.target.value)}
              placeholder="e.g. MAC-8821"
              className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-white text-sm font-semibold transition-all shadow-inner"
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

      {/* AI Multimodal Input Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Text Intake (Primary & Larger Window) */}
        <div className="lg:col-span-7 flex flex-col">
          <TextIntake 
            onExtractionSuccess={handleAIExtraction} 
            onError={handleManualError} 
          />
        </div>

        {/* Right Side: Voice Intake & Photo Scanner (Stacked Vertically) */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <AudioRecorder 
            onExtractionSuccess={handleAIExtraction} 
            onError={handleManualError} 
          />
          
          <PhotoScanner 
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
          defaultMacNo={customerMacNo}
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
