'use client';

import { useState, useRef, useEffect } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  jsonData?: any;
  filename?: string;
  onExport?: () => void;
  // Simplify feature props - display only
  simplifiedPdfUrl?: string | null;
  isSimplified?: boolean;
}

// Height per "page" in pixels - tweak this based on actual PDF rendering
const PAGE_HEIGHT = 280;
const INITIAL_PAGES = 3;
const MAX_EXPANDED_PAGES = 5; // Show 5 pages when expanded (reasonable viewport fit)

export default function PDFViewer({ 
  pdfUrl, 
  jsonData, 
  filename, 
  onExport,
  simplifiedPdfUrl,
  isSimplified = false,
}: PDFViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Force iframe reload on URL change
  const viewerRef = useRef<HTMLDivElement>(null);
  
  // Determine which URL to display
  const displayUrl = isSimplified && simplifiedPdfUrl ? simplifiedPdfUrl : pdfUrl;
  
  // Debug logging
  useEffect(() => {
    console.log('PDFViewer - displayUrl:', displayUrl);
    console.log('PDFViewer - pdfUrl:', pdfUrl);
    console.log('PDFViewer - isSimplified:', isSimplified);
    console.log('PDFViewer - simplifiedPdfUrl:', simplifiedPdfUrl);
  }, [displayUrl, pdfUrl, isSimplified, simplifiedPdfUrl]);
  
  // Update iframe when display URL changes
  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [displayUrl]);
  
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
      className="rounded-2xl p-4 sm:p-5 md:p-6"
      style={{
        background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.5), rgba(192, 255, 248, 0.5))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* Header row with title and buttons */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Folder icon */}
          <img 
            src="/assets/images/folder.png" 
            alt="" 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain"
          />
          <div className="flex flex-col">
            <h2 
              className="text-base sm:text-lg md:text-xl lg:text-2xl"
              style={{
                fontFamily: 'Urbanist, sans-serif',
                fontWeight: 800,
                color: 'var(--dark)',
              }}
            >
              {isSimplified ? 'Simplified View' : 'Syllabus PDF'}
            </h2>
            {/* Simplified indicator badge */}
            {isSimplified && (
              <span 
                className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit mt-1 animate-fade-in"
                style={{
                  background: 'var(--gradient-goldy)',
                  color: 'var(--dark)',
                  fontFamily: 'Urbanist, sans-serif',
                }}
              >
                Accessible Format
              </span>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Download JSON button */}
          <button
            onClick={handleDownloadJSON}
            disabled={!jsonData}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              JSON
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
      </div>
      
      {/* PDF viewer container with frosted inner glass */}
      <div 
        className="relative rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          border: isSimplified 
            ? '2px solid var(--lime)' 
            : '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: isSimplified 
            ? '0 0 20px rgba(179, 233, 127, 0.3)' 
            : 'none',
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
          {isSimplified ? '✨ Simplified' : 'Page 1 of 10'}
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
            key={iframeKey}
            src={displayUrl}
            className="w-full"
            style={{ 
              height: `${expandedHeight}px`,
            }}
            title={isSimplified ? "Simplified Syllabus" : "Syllabus PDF"}
            onError={(e) => {
              console.error('PDF iframe load error:', e);
              console.error('Failed to load PDF from:', displayUrl);
            }}
          >
            {/* Fallback content if iframe doesn't work */}
            <p className="p-4 text-center" style={{ fontFamily: 'Urbanist, sans-serif' }}>
              Unable to display PDF. 
              <a 
                href={displayUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline ml-2"
                style={{ color: 'var(--blue-body)' }}
              >
                Click here to open in a new tab
              </a>
            </p>
          </iframe>
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
      
      {/* Fade-in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
