'use client';

import { useState } from 'react';

interface MenuBarProps {
  onTranslate?: () => void;
  onScreenReader?: () => void;
  onSimplify?: () => void;
}

export default function MenuBar({ onTranslate, onScreenReader, onSimplify }: MenuBarProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md px-6 py-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
          Syllabus Analysis
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={onTranslate}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 hover:border-purple-300 hover:shadow-md group"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Translate</span>
          </button>

          <button
            onClick={onScreenReader}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 hover:border-pink-300 hover:shadow-md group"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828 0a5 5 0 001.414-1.414m-7.071 0A9 9 0 016.343 3.464" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Screen Reader</span>
          </button>

          <button
            onClick={onSimplify}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 hover:border-orange-300 hover:shadow-md group"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Simplify</span>
          </button>
        </div>
      </div>
    </div>
  );
}
