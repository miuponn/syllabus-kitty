'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import PawfessorLoading from './PawfessorLoading';
import { createClient } from '@/app/lib/supabaseClient';

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface UploadState {
  uploading: boolean;
  processing: boolean;
  progress: number;
  error: string | null;
  result: any | null;
}

// Fun loading phrases to cycle through
const LOADING_PHRASES = [
  "Gone fishing...",
  "Pawfessor is grading your syllabus...",
  "Chasing laser pointers...",
  "Napping on your textbook...",
  "Sharpening claws on deadlines...",
  "Knocking things off your desk...",
  "Hunting for extra credit...",
  "Stretching before the big read...",
  "Meow-nalyzing course content...",
  "Pawsing for dramatic effect...",
  "Untangling assignment yarn...",
  "Sniffing out important dates...",
  "Batting at due dates...",
  "Curling up with your syllabus...",
  "Making biscuits on the keyboard...",
  "Doing cat-culations...",
  "Finding the purr-fect schedule...",
  "Whisker-ing through pages...",
  "Pouncing on course objectives...",
  "Having a meow-ment...",
];

export default function UploadSection() {
  const { getTokens } = useAuth();
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    processing: false,
    progress: 0,
    error: null,
    result: null,
  });
  const [dragActive, setDragActive] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle through fun loading phrases
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (uploadState.uploading) {
      // Pick a random phrase immediately
      setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
      
      // Then cycle every 2.5 seconds
      interval = setInterval(() => {
        setLoadingPhrase(prev => {
          // Pick a different phrase than the current one
          let newPhrase = prev;
          while (newPhrase === prev) {
            newPhrase = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
          }
          return newPhrase;
        });
      }, 2500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadState.uploading]);

  // Fake progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (uploadState.uploading && uploadState.progress < 95) {
      interval = setInterval(() => {
        setUploadState(prev => {
          // Slow down as we get higher
          const increment = prev.processing 
            ? Math.random() * 2 + 0.5  // Slower during AI processing (0.5-2.5%)
            : Math.random() * 5 + 2;   // Faster during upload (2-7%)
          
          const maxProgress = prev.processing ? 95 : 45; // Cap at 45% during upload, 95% during processing
          const newProgress = Math.min(prev.progress + increment, maxProgress);
          
          return { ...prev, progress: newProgress };
        });
      }, 300);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadState.uploading, uploadState.processing]);

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
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadState({
        uploading: false,
        processing: false,
        progress: 0,
        error: 'Please upload a PDF file',
        result: null,
      });
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadState({
        uploading: false,
        processing: false,
        progress: 0,
        error: 'File size exceeds 25MB limit',
        result: null,
      });
      return;
    }

    setUploadState({
      uploading: true,
      processing: false,
      progress: 0,
      error: null,
      result: null,
    });

    try {
      const { supabaseToken, googleAccessToken, googleRefreshToken } = await getTokens();
      
      console.log('Tokens available:', {
        supabase: supabaseToken ? '✓' : '✗',
        googleAccess: googleAccessToken ? '✓' : '✗',
        googleRefresh: googleRefreshToken ? '✓' : '✗',
      });
      
      // Upload PDF to Supabase Storage
      const supabase = createClient();
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      
      if (!userId) {
        throw new Error('Please sign in to upload files');
      }
      
      // Generate unique storage path
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const storagePath = `${userId}/${timestamp}_${randomStr}.pdf`;
      
      console.log('Uploading PDF to Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('syllabi')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('syllabi')
        .getPublicUrl(storagePath);
      
      const pdfUrl = urlData.publicUrl;
      console.log('PDF uploaded successfully:', pdfUrl);
      
      // Send PDF to backend for AI processing first
      // Backend will return the file_id it uses
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pdf_url', pdfUrl);

      const headers: HeadersInit = {};
      
      if (supabaseToken) {
        headers['Authorization'] = `Bearer ${supabaseToken}`;
      }
      
      if (googleAccessToken) headers['X-Google-Access-Token'] = googleAccessToken;
      if (googleRefreshToken) headers['X-Google-Refresh-Token'] = googleRefreshToken;

      setUploadState(prev => ({ ...prev, processing: true }));
      
      const response = await fetch(`${BACKEND_URL}/api/syllabus/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      // insert into sillabi table with the file_id from backend
      const backendFileId = result.file_id || result.syllabus_id;
      if (backendFileId) {
        const { error: insertError } = await supabase
          .from('sillabi')
          .insert({
            file_id: backendFileId,
            pdf_url: pdfUrl,
            course_name: result.course_name || file.name.replace('.pdf', ''),
          });
        
        if (insertError) {
          console.error('Error inserting into sillabi:', insertError);
        } else {
          console.log('PDF info saved to database with file_id:', backendFileId);
        }
      }
      
      setUploadState({
        uploading: false,
        processing: false,
        progress: 100,
        error: null,
        result: result,
      });

      // Redirect to syllabus view page using backend's file_id
      const syllabusId = result.file_id || result.syllabus_id;
      setTimeout(() => {
        router.push(`/syllabus/${syllabusId}`);
      }, 1500);

    } catch (error) {
      setUploadState({
        uploading: false,
        processing: false,
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
    <div className="max-w-5xl mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-[2] rounded-4xl p-8 sm:p-12 transition-all duration-500 ease-in-out group ${
          dragActive
            ? 'border-solid scale-[1.03]'
            : 'border-dotted'
        } ${
          uploadState.uploading ? 'pointer-events-none' : 'hover:scale-[1.03] hover:border-solid'
        }`}
        style={{ 
          background: uploadState.uploading ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.7)',
          borderWidth: 'min(5px, 0.5vw)',
          borderColor: '#6C82FF'
        }}
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
            <div className="space-y-6">
              <PawfessorLoading variant="pink" strokeColor="#C76585" />
              <div className="w-full max-w-md mx-auto">
                <div className="bg-white/50 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${uploadState.progress}%`,
                      background: 'var(--gradient-rainbow)'
                    }}
                  />
                </div>
                <p 
                  className="text-sm mt-2 font-semibold transition-all duration-300"
                  style={{ fontFamily: 'Urbanist, sans-serif', color: 'rgba(214, 131, 151, 0.9)' }}
                >
                  {uploadState.processing 
                    ? `${loadingPhrase} ${Math.round(uploadState.progress)}%`
                    : `Uploading... ${Math.round(uploadState.progress)}%`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Paw Icon with hover effect */}
              <div className="animate-point-down relative group/paw w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                <img 
                  src="/assets/images/paw 4.svg" 
                  alt="Drop here" 
                  className="w-full h-full absolute inset-0 transition-opacity duration-300 group-hover/paw:opacity-0"
                />
                <img 
                  src="/assets/images/paw 4-hover.svg" 
                  alt="Drop here" 
                  className="w-full h-full absolute inset-0 transition-opacity duration-300 opacity-0 group-hover/paw:opacity-100"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <p 
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight"
                  style={{ fontFamily: 'Chewie, display', color: '#C76585' }}
                >
                  Drop your syllabus here
                </p>
                <p 
                  className="text-xl sm:text-2xl font-semibold"
                  style={{ fontFamily: 'Urbanist, sans-serif', color: 'rgba(214, 131, 151, 0.8)' }}
                >
                  or
                </p>
              </div>

              <button
                onClick={onButtonClick}
                className="gradient-button"
                style={{ 
                  '--gradient': 'linear-gradient(to right, #FB9DC1, #FFAC95)',
                  fontFamily: 'Poppins, sans-serif'
                } as any}
              >
                Choose PDF File
              </button>
              
              <p 
                className="text-xs sm:text-sm font-extrabold mt-4"
                style={{ fontFamily: 'Urbanist, sans-serif', color: 'rgba(214, 131, 151, 0.8)' }}
              >
                Maximum file size: 25 MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div 
          className="mt-6 p-6 rounded-2xl animate-wiggle"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #FC76FF'
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-4xl">❌</span>
            <div>
              <p 
                className="font-bold mb-1"
                style={{ fontFamily: 'Poppins, sans-serif', color: '#C76585' }}
              >
                Oops!
              </p>
              <p style={{ fontFamily: 'Urbanist, sans-serif', color: '#D68397' }}>
                {uploadState.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadState.result && (
        <div className="mt-6 p-8 frosted-glass border-2 border-lime rounded-2xl kawaii-shadow">
          <div className="flex items-start gap-4">
            <span className="text-5xl animate-bounce">✨</span>
            <div className="flex-1">
              <p className="font-poppins font-bold text-dark text-xl mb-2">
                Success! Your syllabus is ready! 🎉
              </p>
              <p className="text-dark/70 mb-4 font-urbanist">
                Redirecting to your syllabus view...
              </p>
              
              {/* Preview of extracted data */}
              {uploadState.result.extracted_data && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-poppins font-bold text-dark">Quick Preview:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadState.result.extracted_data.extracted_sections?.title?.[0] && (
                      <div className="bg-white/60 p-4 rounded-xl border border-hotpinku/20">
                        <p className="text-xs text-dark/50 mb-1 font-urbanist">Course Title</p>
                        <p className="font-poppins font-semibold text-dark">
                          {uploadState.result.extracted_data.extracted_sections.title[0].text}
                        </p>
                      </div>
                    )}
                    {uploadState.result.extracted_data.extracted_sections?.code?.[0] && (
                      <div className="bg-white/60 p-4 rounded-xl border border-blue-body/20">
                        <p className="text-xs text-dark/50 mb-1 font-urbanist">Course Code</p>
                        <p className="font-poppins font-semibold text-dark">
                          {uploadState.result.extracted_data.extracted_sections.code[0].text}
                        </p>
                      </div>
                    )}
                    {uploadState.result.extracted_data.institution?.name && (
                      <div className="bg-white/60 p-4 rounded-xl border border-purple-body/20">
                        <p className="text-xs text-dark/50 mb-1 font-urbanist">Institution</p>
                        <p className="font-poppins font-semibold text-dark">
                          {uploadState.result.extracted_data.institution.name}
                        </p>
                      </div>
                    )}
                    {uploadState.result.extracted_data.date && (
                      <div className="bg-white/60 p-4 rounded-xl border border-medium-rose/20">
                        <p className="text-xs text-dark/50 mb-1 font-urbanist">Term</p>
                        <p className="font-poppins font-semibold text-dark">
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
    </div>
  );
}
