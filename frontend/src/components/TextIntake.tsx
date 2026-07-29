import TestGuide from "@/components/TestGuide";

interface TextIntakeProps {
  textValue?: string;
  setTextValue?: (text: string) => void;
  onExtractionSuccess: (data: ExtractedBatch) => void;
  onError: (error: string) => void;
}

const EXAMPLES = [
  {
    label: "Japfa Indonesia Batch",
    text: "Customer: Japfa Indonesia (Contact: Sheila)\nRequest: 4 broiler grower feed samples (descriptions 1001 to 1004)\nTests: Total AA, Supp. AA, and Trp tests",
  },
  {
    label: "Smith Farms Feed",
    text: "Customer: Smith Farms Ltd\nSample 1: Broiler finisher feed - test Total AA and NIR\nSample 2: Piglet starter feed - test NIR and GAA",
  },
  {
    label: "Wheat Bran Fiber",
    text: "Customer: Agri-Nutrition Labs\nRequest: 3 wheat bran samples\nTests: Total Dietary Fiber (TDF) and NIR test",
  },
];

export default function TextIntake({ textValue, setTextValue, onExtractionSuccess, onError }: TextIntakeProps) {
  const [internalText, setInternalText] = useState("");

  const text = textValue !== undefined ? textValue : internalText;
  const setText = setTextValue || setInternalText;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExtract = async () => {
    if (!text.trim()) {
      onError("Please type sample details into the box first, or click '+ Japfa Indonesia Batch' above to load an example!");
      return;
    }

    setIsProcessing(true);
    try {
      const data = await api.processText(text);
      onExtractionSuccess(data);
    } catch (err: any) {
      onError(err.message || "Failed to process text with AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadExample = (exampleText: string) => {
    setText(exampleText);
  };

  const clearText = () => {
    setText("");
  };

  const handleInsertPhrase = (phrase: string) => {
    setText((prev) => (prev ? `${prev}, ${phrase}` : phrase));
  };

  return (
    <div className="glass-panel glass-panel-glow rounded-3xl p-6 flex flex-col justify-between h-full min-h-[380px] transition-all relative overflow-hidden">
      {/* Badge */}
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-brand-300 bg-brand-500/10 border-bl border-white/5 rounded-bl-xl">
        <FileText className="w-3.5 h-3.5" /> Primary Intake
      </div>

      {/* Header & Quick Templates */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 font-outfit flex items-center gap-2">
              Text Intake
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Type or paste sample descriptions, lab notes, or email requests directly.
            </p>
          </div>
        </div>

        {/* Test Guide & Spoken Phrases */}
        <TestGuide onInsertPhrase={handleInsertPhrase} />

        {/* Preset Template Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Presets:
          </span>
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadExample(ex.text)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-brand-500/15 border border-white/10 hover:border-brand-500/30 text-xs text-slate-300 hover:text-brand-300 font-medium transition-all"
            >
              + {ex.label}
            </button>
          ))}
          {text && (
            <button
              type="button"
              onClick={clearText}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 font-medium transition-all flex items-center gap-1 ml-auto"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Text Area */}
        <div className="relative flex-grow">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste sample list here...&#10;&#10;e.g. 4 broiler grower feed samples from Japfa Indonesia, requesting total AA / supp. AA, trp tests, descriptions are from 1001 to 1004, contact person is Sheila"
            className="w-full h-56 sm:h-64 p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-brand-500/30 focus:border-brand-500 focus:outline-none text-slate-100 placeholder-slate-500 text-sm font-mono leading-relaxed resize-none transition-all shadow-inner custom-scrollbar"
          />
        </div>
      </div>

      {/* Footer / Submit Action */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="text-[11px] text-slate-500">
          {text.length > 0 ? `${text.length} characters` : "Ready for text input"}
        </div>

        <button
          type="button"
          onClick={handleExtract}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-brand-600/20 hover:shadow-brand-600/35 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Parsing with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-brand-300" />
              Extract Samples with AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}
