"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, RefreshCw, QrCode } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import SampleGrid from "@/components/SampleGrid";
import { api, SubmissionBatch } from "@/utils/api";

function ReviewAndConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batch_id");

  const [batch, setBatch] = useState<SubmissionBatch | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [customerMacNo, setCustomerMacNo] = useState("");
  const [rowData, setRowData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Load batch data
  const loadBatch = async () => {
    if (!batchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setValidationErrors([]);
    try {
      const data = await api.getBatch(batchId);
      setBatch(data);
      setCompanyName(data.customer?.name || "");
      setSubmitterName(data.submitter_name || "");
      setCustomerMacNo(data.customer_mac_no || "");
      setRowData(data.samples || []);
    } catch (err: any) {
      setErrorMsg("Failed to load submission batch details. Make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatch();
  }, [batchId]);

  const handleUpdateDraft = async () => {
    if (!batchId) return false;
    try {
      await api.updateBatch(batchId, companyName, customerMacNo, submitterName, rowData);
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update draft modifications.");
      return false;
    }
  };

  const handleFinalSubmit = async () => {
    if (!batchId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setValidationErrors([]);

    try {
      // 1. Save any grid/worksheet edits first
      const saveOk = await handleUpdateDraft();
      if (!saveOk) {
        setIsSubmitting(false);
        return;
      }

      // 2. Call final submission validation endpoint
      await api.submitBatch(batchId);
      
      // 3. Success! Go to manifest printer page
      router.push(`/manifest/${batchId}`);
    } catch (err: any) {
      // Check if it's a structural Pydantic validation list from the server
      try {
        const parsedErrors = JSON.parse(err.message);
        if (Array.isArray(parsedErrors)) {
          setValidationErrors(parsedErrors);
          setErrorMsg("Validation failed: Please review sample inputs highlighted below.");
        } else {
          setErrorMsg(err.message);
        }
      } catch {
        setErrorMsg(err.message || "Failed to finalize registration.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-300">Loading intake batch details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 font-inter">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Link 
          href="/" 
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-outfit">
            Review & Confirm Registration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit extracted fields, correct errors, and submit batch to LIMS.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Draft details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col gap-1.5 flex-1 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Smith Farms Ltd"
                className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-white text-sm font-semibold transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 flex-1 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Submitter Name / Email
              </label>
              <input
                type="text"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="e.g. Sheila (sheila@example.com)"
                className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-white text-sm font-semibold transition-all"
              />
            </div>
          </div>

          <SampleGrid 
            rowData={rowData} 
            setRowData={setRowData} 
            validationErrors={validationErrors}
            defaultMacNo={customerMacNo}
            defaultContactPerson="Sheila"
          />
        </div>

        {/* Status / Submit panel */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl h-fit flex flex-col gap-6">
          <h3 className="text-md font-bold text-slate-200 font-outfit border-b border-white/5 pb-3">
            Registration Audit
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Status</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                {batch?.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Batch No.</span>
              <span className="font-bold text-brand-400 font-outfit text-sm">
                #{batch?.batch_number || "1000"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Batch UUID</span>
              <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                {batch?.id}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Total Samples</span>
              <span className="font-semibold text-slate-200">{rowData.length}</span>
            </div>
          </div>
          {/* Live Page Web Link QR Code */}
          {batchId && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold w-full">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-brand-400" />
                  <span>Web Link QR Code</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">Live URL</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl shadow-md">
                <QRCodeSVG 
                  value={typeof window !== "undefined" ? `${window.location.origin}/review?batch_id=${batchId}` : `/review?batch_id=${batchId}`}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <a
                href={typeof window !== "undefined" ? `${window.location.origin}/review?batch_id=${batchId}` : `/review?batch_id=${batchId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-brand-400 hover:underline max-w-[200px] truncate text-center font-semibold"
                title={typeof window !== "undefined" ? `${window.location.origin}/review?batch_id=${batchId}` : `/review?batch_id=${batchId}`}
              >
                {typeof window !== "undefined" ? `${window.location.origin}/review?batch_id=${batchId}` : `/review?batch_id=${batchId}`}
              </a>
              <span className="text-[9px] text-slate-400 text-center">
                Scan with phone camera or QR scanner to open page link
              </span>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-400 flex flex-col gap-2">
            <h4 className="font-bold text-slate-300">Mandatory Rules Checklist</h4>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${companyName.trim() ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>Company name provided</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${rowData.length > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>Contains at least 1 sample</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${rowData.every(r => r.material_code) ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>All material codes standardized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${rowData.every(r => r.sample_description?.trim()) ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>All sample descriptions filled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${rowData.every(r => r.test_total_aa || r.test_supp_aa || r.test_nir || r.test_trp || r.test_gaa || r.test_tdf) ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>At least 1 test requested per sample</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting || rowData.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering & Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Submit to LIMS
                </>
              )}
            </button>
            
            <button
              onClick={loadBatch}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Worksheet Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ReviewAndConfirm() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-300">Loading intake batch details...</span>
      </div>
    }>
      <ReviewAndConfirmContent />
    </Suspense>
  );
}
