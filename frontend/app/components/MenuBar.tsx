'use client';

interface MenuBarProps {
  onTranslate?: () => void;
  onScreenReader?: () => void;
  onSimplify?: () => void;
}

export default function MenuBar({ onTranslate, onScreenReader, onSimplify }: MenuBarProps) {
  return (
    <div className="frosted-glass rounded-2xl shadow-kawaii px-6 py-5 mb-6 border border-hotpinku/20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h2 className="text-2xl font-poppins font-bold bg-gradient-primary bg-clip-text text-transparent">
              Analysis Tools
            </h2>
            <p className="text-xs text-dark/60 font-urbanist">Make your syllabus work for you</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTranslate}
            className="flex items-center gap-2 px-5 py-3 bg-white/80 hover:bg-white border-2 border-hotpinku/30 rounded-xl transition-all duration-200 hover:border-hotpinku hover:shadow-glow-pink hover:scale-105 group active:scale-95"
          >
            <svg className="w-5 h-5 text-hotpinku transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-sm font-poppins font-semibold text-dark">Translate</span>
          </button>

          <button
            onClick={onScreenReader}
            className="flex items-center gap-2 px-5 py-3 bg-white/80 hover:bg-white border-2 border-blue-body/30 rounded-xl transition-all duration-200 hover:border-blue-body hover:shadow-glow-blue hover:scale-105 group active:scale-95"
          >
            <svg className="w-5 h-5 text-blue-body transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828 0a5 5 0 001.414-1.414m-7.071 0A9 9 0 016.343 3.464" />
            </svg>
            <span className="text-sm font-poppins font-semibold text-dark">Screen Reader</span>
          </button>

          <button
            onClick={onSimplify}
            className="flex items-center gap-2 px-5 py-3 bg-white/80 hover:bg-white border-2 border-purple-body/30 rounded-xl transition-all duration-200 hover:border-purple-body hover:shadow-glow-purple hover:scale-105 group active:scale-95"
          >
            <svg className="w-5 h-5 text-purple-body transition-transform group-hover:rotate-[-5deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-poppins font-semibold text-dark">Simplify</span>
          </button>
        </div>
      </div>
    </div>
  );
}
