'use client';

import { useState, useRef } from 'react';

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: any | null;
}

export default function UploadSection() {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null,
  });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'Please upload a PDF file',
        result: null,
      });
      return;
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'File size exceeds 25MB limit',
        result: null,
      });
      return;
    }

    // Reset state and start upload
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      result: null,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/syllabus/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        result: result,
      });

      // Download JSON file
      downloadJSON(result, file.name);

    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        result: null,
      });
    }
  };

  const downloadJSON = (data: any, originalFilename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${originalFilename.replace('.pdf', '')}_extracted.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-4 border-dashed rounded-3xl p-12 transition-all duration-200 ${
          dragActive
            ? 'border-purple-500 bg-purple-50/50'
            : 'border-gray-300 bg-white/50 backdrop-blur-sm'
        } ${uploadState.uploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
        />

        <div className="text-center">
          {uploadState.uploading ? (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">📄</div>
              <p className="text-xl font-semibold text-purple-600">
                Analyzing your syllabus...
              </p>
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-7xl">📚</div>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-gray-700">
                  Drop your syllabus here
                </p>
                <p className="text-gray-500">or</p>
              </div>
              <button
                onClick={onButtonClick}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white text-lg font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Choose PDF File
              </button>
              <p className="text-sm text-gray-400 mt-4">
                Maximum file size: 25MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="font-semibold text-red-800 mb-1">Upload Error</p>
              <p className="text-red-600">{uploadState.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadState.result && (
        <div className="mt-6 p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-3xl">✅</span>
            <div className="flex-1">
              <p className="font-semibold text-green-800 mb-2">
                Syllabus extracted successfully!
              </p>
              <p className="text-green-600 mb-4">
                JSON file has been downloaded automatically.
              </p>
              
              {/* Preview of extracted data */}
              {uploadState.result.extracted_data && (
                <div className="mt-4 space-y-3">
                  <h3 className="font-semibold text-gray-700">Quick Preview:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadState.result.extracted_data.extracted_sections?.title?.[0] && (
                      <div className="bg-white/70 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Course Title</p>
                        <p className="font-medium text-gray-800">
                          {uploadState.result.extracted_data.extracted_sections.title[0].text}
                        </p>
                      </div>
                    )}
                    {uploadState.result.extracted_data.extracted_sections?.code?.[0] && (
                      <div className="bg-white/70 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Course Code</p>
                        <p className="font-medium text-gray-800">
                          {uploadState.result.extracted_data.extracted_sections.code[0].text}
                        </p>
                      </div>
                    )}
                    {uploadState.result.extracted_data.institution?.name && (
                      <div className="bg-white/70 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Institution</p>
                        <p className="font-medium text-gray-800">
                          {uploadState.result.extracted_data.institution.name}
                        </p>
                      </div>
                    )}
                    {uploadState.result.extracted_data.date && (
                      <div className="bg-white/70 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Term</p>
                        <p className="font-medium text-gray-800">
                          {uploadState.result.extracted_data.date.term} {uploadState.result.extracted_data.date.year}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-100">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-semibold text-gray-800 mb-2">AI-Powered</h3>
          <p className="text-sm text-gray-600">
            Uses Google Gemini AI to intelligently extract course information
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-pink-100">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-semibold text-gray-800 mb-2">Calendar Ready</h3>
          <p className="text-sm text-gray-600">
            Structured data ready for Google Calendar integration
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-orange-100">
          <div className="text-4xl mb-3">💾</div>
          <h3 className="font-semibold text-gray-800 mb-2">JSON Export</h3>
          <p className="text-sm text-gray-600">
            Get a clean JSON file with all extracted course details
          </p>
        </div>
      </div>
    </div>
  );
}
