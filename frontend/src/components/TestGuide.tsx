"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Plus, Sparkles, Volume2, Info } from "lucide-react";

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
    color: "from-blue-900/70 to-indigo-900/70 border-blue-400/50 text-blue-200"
  },
  {
    id: "supp_aa",
    acronym: "Supp AA",
    fullName: "Supplemental / Free AA",
    category: "Formulation check",
    description: "Free crystalline amino acids (Lysine, Methionine, Threonine).",
    spokenPhrase: "test Supp AA",
    color: "from-purple-900/70 to-pink-900/70 border-purple-400/50 text-purple-200"
  },
  {
    id: "nir",
    acronym: "NIR",
    fullName: "Near-Infrared Spectroscopy",
    category: "Rapid Scan",
    description: "Fast 2-minute nutritional check for Moisture, Protein, Fat & Fiber.",
    spokenPhrase: "NIR test",
    color: "from-emerald-900/70 to-teal-900/70 border-emerald-400/50 text-emerald-200"
  },
  {
    id: "trp",
    acronym: "TRP",
    fullName: "Tryptophan Analysis",
    category: "Essential AA",
    description: "Essential amino acid testing for poultry & swine formulation.",
    spokenPhrase: "test TRP",
    color: "from-amber-900/70 to-orange-900/70 border-amber-400/50 text-amber-200"
  },
  {
    id: "gaa",
    acronym: "GAA",
    fullName: "Guanidinoacetic Acid",
    category: "Energy Precursor",
    description: "Creatine precursor additive testing in monogastric feeds.",
    spokenPhrase: "test GAA",
    color: "from-cyan-900/70 to-blue-900/70 border-cyan-400/50 text-cyan-200"
  },
  {
    id: "tdf",
    acronym: "TDF",
    fullName: "Total Dietary Fiber",
    category: "Fiber Quality",
    description: "Soluble and insoluble dietary fiber analysis for feed ingredients.",
    spokenPhrase: "test TDF",
    color: "from-rose-900/70 to-red-900/70 border-rose-400/50 text-rose-200"
  }
];

export default function TestGuide({ onInsertPhrase }: TestGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-slate-800/90 border border-brand-500/30 overflow-hidden transition-all shadow-xl mb-4 backdrop-blur-md">
      {/* Accordion Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-800/90 hover:bg-slate-700/80 flex items-center justify-between text-left transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300">
          <HelpCircle className="w-4 h-4 text-brand-400" />
          <span>Lab Test Guide & Voice Phrases</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-500/25 text-brand-200 border border-brand-400/40 font-semibold">
            6 Standard Tests Available
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-200 font-semibold">
          <span>{isOpen ? "Hide Guide" : "View Test Catalog"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </button>

      {/* Expandable Guide Body */}
      {isOpen && (
        <div className="p-4 border-t border-brand-500/20 bg-slate-900/95">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-200">
            <Info className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span>
              Unsure what tests to ask for? Click any test card below to add it to your text intake note, or use the voice phrases when speaking into the mic!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LAB_TESTS.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl bg-gradient-to-br ${t.color} border flex flex-col justify-between transition-all hover:scale-[1.01] shadow-md`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white tracking-wide font-outfit">
                      {t.acronym}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-slate-100 border border-white/10">
                      {t.category}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mb-1">{t.fullName}</div>
                  <p className="text-[11px] text-slate-200 leading-snug mb-2 font-normal">{t.description}</p>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-100 font-mono font-medium">
                    <Volume2 className="w-3.5 h-3.5 text-brand-300" />
                    <span>"{t.spokenPhrase}"</span>
                  </div>
                  {onInsertPhrase && (
                    <button
                      type="button"
                      onClick={() => onInsertPhrase(t.spokenPhrase)}
                      className="px-2.5 py-1 rounded bg-brand-500/30 hover:bg-brand-500/50 text-brand-200 border border-brand-400/40 text-[11px] font-bold flex items-center gap-1 transition-all"
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
