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
    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300"
  },
  {
    id: "supp_aa",
    acronym: "Supp AA",
    fullName: "Supplemental / Free AA",
    category: "Formulation check",
    description: "Free crystalline amino acids (Lysine, Methionine, Threonine).",
    spokenPhrase: "test Supp AA",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300"
  },
  {
    id: "nir",
    acronym: "NIR",
    fullName: "Near-Infrared Spectroscopy",
    category: "Rapid Scan",
    description: "Fast 2-minute nutritional check for Moisture, Protein, Fat & Fiber.",
    spokenPhrase: "NIR test",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300"
  },
  {
    id: "trp",
    acronym: "TRP",
    fullName: "Tryptophan Analysis",
    category: "Essential AA",
    description: "Essential amino acid testing for poultry & swine formulation.",
    spokenPhrase: "test TRP",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300"
  },
  {
    id: "gaa",
    acronym: "GAA",
    fullName: "Guanidinoacetic Acid",
    category: "Energy Precursor",
    description: "Creatine precursor additive testing in monogastric feeds.",
    spokenPhrase: "test GAA",
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300"
  },
  {
    id: "tdf",
    acronym: "TDF",
    fullName: "Total Dietary Fiber",
    category: "Fiber Quality",
    description: "Soluble and insoluble dietary fiber analysis for feed ingredients.",
    spokenPhrase: "test TDF",
    color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300"
  }
];

export default function TestGuide({ onInsertPhrase }: TestGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden transition-all shadow-lg mb-4">
      {/* Accordion Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 flex items-center justify-between text-left transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300">
          <HelpCircle className="w-4 h-4 text-brand-400" />
          <span>Lab Test Guide & Voice Phrases</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 font-normal">
            6 Standard Tests Available
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <span>{isOpen ? "Hide Guide" : "View Test Catalog"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Guide Body */}
      {isOpen && (
        <div className="p-4 border-t border-white/5 bg-slate-950/60">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
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
                    <span className="text-sm font-bold text-white tracking-wide font-outfit">
                      {t.acronym}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/40 text-slate-300">
                      {t.category}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 mb-1">{t.fullName}</div>
                  <p className="text-[11px] text-slate-400 leading-snug mb-2">{t.description}</p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
                    <Volume2 className="w-3 h-3 text-brand-400" />
                    <span>"{t.spokenPhrase}"</span>
                  </div>
                  {onInsertPhrase && (
                    <button
                      type="button"
                      onClick={() => onInsertPhrase(t.spokenPhrase)}
                      className="px-2 py-1 rounded bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-[10px] font-bold flex items-center gap-1 transition-all"
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
