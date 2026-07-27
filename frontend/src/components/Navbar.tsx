"use client";

import Link from "next/link";
import { Beaker, BarChart2, ShieldCheck, Database } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl shadow-lg shadow-brand-500/20">
            <Beaker className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent font-outfit">
            Sample Registration <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 ml-1">Portal</span>
          </span>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <BarChart2 className="w-4 h-4 text-brand-400" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            LIMS SECURE
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-300 font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
            <Database className="w-3.5 h-3.5" />
            DB v15
          </div>
        </nav>
      </div>
    </header>
  );
}
