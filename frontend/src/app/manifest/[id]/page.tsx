"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, Download, ArrowLeft, Loader2, AlertCircle, FileCheck, Check } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { api, SubmissionBatch } from "@/utils/api";

export default function ShippingManifest() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<SubmissionBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBatch = async () => {
    if (!batchId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getBatch(batchId);
      setBatch(data);
    } catch (err: any) {
      setErrorMsg("Failed to load shipping manifest details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatch();
  }, [batchId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-300">Generating manifest QR code...</span>
      </div>
    );
  }

  if (errorMsg || !batch) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-200">Error Loading Manifest</h2>
        <p className="text-sm text-slate-400">{errorMsg || "Batch not found."}</p>
        <Link href="/" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6 font-inter">
      
      {/* Action Bar (Hidden during Print) */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100 font-outfit">Manifest Generated</h1>
            <p className="text-xs text-slate-400">Print QR tag and stick to shipping crate.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getExportUrl(batchId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.01]"
          >
            <Download className="w-3.5 h-3.5" />
            LIMS CSV
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/10 transition-all transform hover:scale-[1.01]"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Manifest
          </button>
        </div>
      </div>

      {/* Manifest Printable Content Card */}
      <div className="glass-panel rounded-3xl p-8 bg-slate-950/60 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:m-0 flex flex-col gap-8 border border-white/5 relative overflow-hidden">
        
        {/* Zebra indicator for LIMS confirmation */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-500 print:hidden" />
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/5 print:border-slate-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2 print:text-slate-800">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 print:border-emerald-500/50 print:bg-emerald-100 print:text-emerald-700">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 print:text-emerald-700">Submitted Manifest</span>
                <h2 className="text-2xl font-bold font-outfit text-white print:text-black">Intake Shipping Crate Doc</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <span className="text-slate-400 print:text-slate-500">Company Name:</span>
              <span className="font-semibold text-slate-200 print:text-black">{batch.customer?.name}</span>

              <span className="text-slate-400 print:text-slate-500">Submitter Name:</span>
              <span className="font-semibold text-slate-200 print:text-black">{batch.submitter_name || "N/A"}</span>

              <span className="text-slate-400 print:text-slate-500">Batch Number:</span>
              <span className="font-bold text-emerald-400 print:text-emerald-700 font-outfit">#{batch.batch_number || "1000"}</span>

              <span className="text-slate-400 print:text-slate-500">Batch UUID:</span>
              <span className="font-mono text-slate-300 print:text-slate-700 truncate max-w-[140px]">{batch.id}</span>

              <span className="text-slate-400 print:text-slate-500">Timestamp:</span>
              <span className="text-slate-300 print:text-slate-700">{new Date(batch.created_at).toLocaleString()}</span>

              <span className="text-slate-400 print:text-slate-500">Samples Count:</span>
              <span className="font-semibold text-slate-200 print:text-black">{batch.samples?.length} items</span>
            </div>
          </div>

          {/* QR Code Segment */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-md w-fit self-center">
            {batch.manifest_qr_code ? (
              <QRCodeSVG 
                value={batch.manifest_qr_code} 
                size={140}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400">QR Code Error</div>
            )}
            <span className="text-[9px] font-mono text-slate-500 tracking-wider">SCAN AT LAB RECEIVING</span>
          </div>
        </div>

        {/* Samples Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 print:text-slate-700 uppercase tracking-wider font-outfit">
            Registered Sample Listing
          </h3>
          
          <div className="border border-white/5 print:border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-slate-400 print:bg-slate-100 print:text-slate-600 print:border-slate-200">
                  <th className="py-2.5 px-4 font-semibold text-center w-12">#</th>
                  <th className="py-2.5 px-4 font-semibold">Material</th>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Tests Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-slate-200">
                {batch.samples?.map((sample, idx) => {
                  const tests = [];
                  if (sample.test_total_aa) tests.push("Total AA");
                  if (sample.test_supp_aa) tests.push("Supp AA");
                  if (sample.test_nir) tests.push("NIR");
                  if (sample.test_trp) tests.push("Trp");
                  if (sample.test_gaa) tests.push("GAA");

                  return (
                    <tr key={sample.id} className="hover:bg-white/5 print:text-black">
                      <td className="py-3 px-4 text-center font-mono text-slate-400 print:text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-brand-300 print:text-brand-700">{sample.material_code}</td>
                      <td className="py-3 px-4 font-medium">{sample.sample_description}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {tests.map((testName, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 border border-brand-500/20 text-brand-300 print:bg-slate-100 print:border-slate-300 print:text-slate-800"
                            >
                              {testName}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crate Label Notice */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-400 text-[11px] leading-relaxed print:bg-slate-50 print:border-slate-200 print:text-slate-600 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-300 print:text-slate-700">Lab Receiver Note:</span> This manifest document has been digitally uploaded and registered in LIMS. Crate matching and intake validation will occur instantly upon scanning the manifest QR Code. Do not ship without secure attachment.
          </div>
        </div>
      </div>
    </div>
  );
}
