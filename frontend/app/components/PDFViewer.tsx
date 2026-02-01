'use client';

import { useState, useRef, useEffect } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  jsonData?: any;
  filename?: string;
  onExport?: () => void;
}

// Height per "page" in pixels - tweak this based on actual PDF rendering
const PAGE_HEIGHT = 280;
const INITIAL_PAGES = 3;
const MAX_EXPANDED_PAGES = 33; // 3 initial + 30 more

export default function PDFViewer({ pdfUrl, jsonData, filename, onExport }: PDFViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  // Calculate heights for collapsed and expanded states
  const collapsedHeight = PAGE_HEIGHT * INITIAL_PAGES;
  const expandedHeight = PAGE_HEIGHT * MAX_EXPANDED_PAGES;
  const currentHeight = isExpanded ? expandedHeight : collapsedHeight;

  const handleToggleExpand = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
  };

  // Reset animation flag after transition completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const handleDownloadJSON = () => {
    if (!jsonData) return;
    
    const jsonStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename 
      ? `${filename.replace('.pdf', '')}_extracted.json`
      : 'syllabus_extracted.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    // Placeholder for export functionality - can be wired up later
    if (onExport) {
      onExport();
    } else {
      // Default behavior: open PDF in new tab for download
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div 
      className="rounded-2xl p-4 sm:p-5 md:p-6 h-full"
      style={{
        background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.5), rgba(192, 255, 248, 0.5))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* Header row with title and export button */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Folder icon */}
          <img 
            src="/assets/images/folder.png" 
            alt="" 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain"
          />
          <h2 
            className="text-base sm:text-lg md:text-xl lg:text-2xl"
            style={{
              fontFamily: 'Urbanist, sans-serif',
              fontWeight: 800,
              color: 'var(--dark)',
            }}
          >
            Syllabus PDF
          </h2>
        </div>
        
        {/* Download JSON button - glass style with gradient text and icon */}
        <button
          onClick={handleDownloadJSON}
          disabled={!jsonData}
          className="flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '2px solid white',
          }}
        >
          <span 
            style={{
              fontFamily: 'Urbanist, sans-serif',
              fontWeight: 700,
              background: 'var(--gradient-gem-dark)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Download JSON
          </span>
          {/* Export icon with matching gradient */}
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5"
            viewBox="0 0 24 24" 
            fill="none"
            stroke="url(#gem-dark-gradient)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="gem-dark-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3045bb" />
                <stop offset="100%" stopColor="#24bbc6" />
              </linearGradient>
            </defs>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* PDF viewer container with frosted inner glass */}
      <div 
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Page indicator */}
        <div 
          className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            color: 'var(--dark)',
            fontFamily: 'Urbanist, sans-serif',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          Page 1 of 10
        </div>

        {/* Scrollable PDF area with smooth height transition */}
        <div 
          ref={viewerRef}
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ 
            height: `${currentHeight}px`,
          }}
        >
          <iframe
            src={pdfUrl}
            className="w-full"
            style={{ height: `${expandedHeight}px` }}
            title="Syllabus PDF"
          />
        </div>
      </div>

      {/* Expand/Collapse toggle with rotating caret */}
      <div className="mt-2 sm:mt-3 flex justify-center">
        <button
          onClick={handleToggleExpand}
          className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/50"
          style={{
            fontFamily: 'Urbanist, sans-serif',
            fontWeight: 600,
            color: 'var(--dark)',
          }}
        >
          <span className="text-sm sm:text-base">
            {isExpanded ? 'Collapse All' : 'Expand to View More'}
          </span>
          
          {/* Rotating caret icon */}
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ease-in-out group-hover:translate-y-0.5"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-in-out',
            }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
