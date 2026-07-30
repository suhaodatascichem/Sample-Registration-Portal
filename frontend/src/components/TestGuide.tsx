"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Plus, Volume2, Info } from "lucide-react";

interface TestGuideProps {
  onInsertPhrase?: (phrase: string) => void;
}

export const LAB_TESTS = [
  {
    id: "total_aa",
    acronym: "Total AA",
    fullName: "Total Amino Acids",
    category: "Protein Profile",
    description: "Complete amino acid profile bound in raw materials & feed.",
    spokenPhrase: "test Total AA",
    color: "from-blue-50 to-indigo-50 border-blue-200/80 text-blue-950"
  },
  {
    id: "supp_aa",
    acronym: "Supp AA",
    fullName: "Supplemental / Free AA",
    category: "Formulation check",
    description: "Free crystalline amino acids (Lysine, Methionine, Threonine).",
    spokenPhrase: "test Supp AA",
    color: "from-purple-50 to-pink-50 border-purple-200/80 text-purple-950"
  },
  {
    id: "nir",
    acronym: "NIR",
    fullName: "Near-Infrared Spectroscopy",
    category: "Rapid Scan",
    description: "Fast 2-minute nutritional check for Moisture, Protein, Fat & Fiber.",
    spokenPhrase: "NIR test",
    color: "from-emerald-50 to-teal-50 border-emerald-200/80 text-emerald-950"
  },
  {
    id: "trp",
    acronym: "TRP",
    fullName: "Tryptophan Analysis",
    category: "Essential AA",
    description: "Essential amino acid testing for poultry & swine formulation.",
    spokenPhrase: "test TRP",
    color: "from-amber-50 to-orange-50 border-amber-200/80 text-amber-950"
  },
  {
    id: "gaa",
    acronym: "GAA",
    fullName: "Guanidinoacetic Acid",
    category: "Energy Precursor",
    description: "Creatine precursor additive testing in monogastric feeds.",
    spokenPhrase: "test GAA",
    color: "from-cyan-50 to-blue-50 border-cyan-200/80 text-cyan-950"
  },
  {
    id: "tdf",
    acronym: "TDF",
    fullName: "Total Dietary Fiber",
    category: "Fiber Quality",
    description: "Soluble and insoluble dietary fiber analysis for feed ingredients.",
    spokenPhrase: "test TDF",
    color: "from-rose-50 to-red-50 border-rose-200/80 text-rose-950"
  }
];

export default function TestGuide({ onInsertPhrase }: TestGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-violet-100/90 via-indigo-50/90 to-purple-100/90 border border-violet-300/80 overflow-hidden transition-all shadow-md mb-4 backdrop-blur-md">
      {/* Accordion Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-violet-200/50 hover:bg-violet-200/80 flex items-center justify-between text-left transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-900">
          <HelpCircle className="w-4 h-4 text-violet-700" />
          <span>Lab Test Guide & Voice Phrases</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-violet-600 text-white border border-violet-500 font-bold">
            6 Standard Tests Available
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-violet-900 font-bold">
          <span>{isOpen ? "Hide Guide" : "View Test Catalog"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-violet-700" /> : <ChevronDown className="w-4 h-4 text-violet-700" />}
        </div>
      </button>

      {/* Expandable Guide Body */}
      {isOpen && (
        <div className="p-4 border-t border-violet-200/80 bg-white/95">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-700 font-medium">
            <Info className="w-4 h-4 text-violet-600 flex-shrink-0" />
            <span>
              Unsure what tests to ask for? Click any test card below to add it to your text intake note, or use the voice phrases when speaking into the mic!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LAB_TESTS.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl bg-gradient-to-br ${t.color} border flex flex-col justify-between transition-all hover:scale-[1.01] shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900 tracking-wide font-outfit">
                      {t.acronym}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                      {t.category}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mb-1">{t.fullName}</div>
                  <p className="text-[11px] text-slate-600 leading-snug mb-2 font-normal">{t.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-900 font-mono font-bold">
                    <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                    <span>"{t.spokenPhrase}"</span>
                  </div>
                  {onInsertPhrase && (
                    <button
                      type="button"
                      onClick={() => onInsertPhrase(t.spokenPhrase)}
                      className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Insert
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
