'use client';

import { useState } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  onReload?: () => void;
}

export default function PDFViewer({ pdfUrl, onReload }: PDFViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visiblePages, setVisiblePages] = useState(3);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Syllabus PDF</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand All'}
        </button>
      </div>

      <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
        <div className="h-[600px] overflow-y-auto">
          {/* PDF Embed */}
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title="Syllabus PDF"
          />
        </div>

        {/* Page markers overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-sm text-gray-600">
          Page 1 of 10
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {isExpanded ? 'Showing all pages' : `Showing first ${visiblePages} pages`}
        </p>
      </div>
    </div>
  );
}
