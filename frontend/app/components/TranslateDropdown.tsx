'use client';

import { useState, useRef, useEffect } from 'react';

// Supported languages (matches backend)
const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ar: 'Arabic',
  hi: 'Hindi',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  de: 'German',
  it: 'Italian',
  vi: 'Vietnamese',
  tl: 'Tagalog',
  fa: 'Persian (Farsi)',
  uk: 'Ukrainian',
  pl: 'Polish',
  tr: 'Turkish',
};

interface TranslateDropdownProps {
  onTranslate: (languageCode: string) => Promise<void>;
  isTranslating?: boolean;
  disabled?: boolean;
  hasSimplified?: boolean; // Whether simplified version exists
}

export default function TranslateDropdown({
  onTranslate,
  isTranslating = false,
  disabled = false,
  hasSimplified = false,
}: TranslateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
  };

  const handleTranslateClick = async () => {
    if (!selectedLanguage) return;
    
    try {
      await onTranslate(selectedLanguage);
      setIsOpen(false);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const buttonColor = 'var(--bubbles)';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Translate Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isTranslating}
        className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-sm sm:text-base flex items-center gap-2"
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)',
          border: `2px solid ${buttonColor}`,
          color: 'white',
          backgroundColor: buttonColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isTranslating) {
            const btn = e.currentTarget;
            btn.style.backgroundColor = 'white';
            btn.style.color = buttonColor;
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.backgroundColor = buttonColor;
          btn.style.color = 'white';
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = 'none';
        }}
      >
        {/* Translate Icon */}
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
        {isTranslating ? 'Translating...' : 'Translate'}
        <svg 
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 z-50"
          style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--bubbles)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3"
            style={{
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <p 
              className="text-sm font-semibold"
              style={{ color: 'var(--purple-body)', fontFamily: 'Poppins, sans-serif' }}
            >
              Select Language
            </p>
            {!hasSimplified && (
              <p className="text-xs text-gray-500 mt-1">
                Click &quot;Simplify&quot; first to enable translation
              </p>
            )}
          </div>

          {/* Language List */}
          <div 
            className="max-h-64 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageSelect(code)}
                disabled={!hasSimplified}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  backgroundColor: selectedLanguage === code ? 'var(--bubbles)' : 'transparent',
                  color: selectedLanguage === code ? 'white' : '#374151',
                  cursor: hasSimplified ? 'pointer' : 'not-allowed',
                  opacity: hasSimplified ? 1 : 0.5,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (hasSimplified && selectedLanguage !== code) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLanguage !== code) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{name}</span>
                {selectedLanguage === code && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Translate Button */}
          <div 
            className="px-4 py-3"
            style={{
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <button
              onClick={handleTranslateClick}
              disabled={!selectedLanguage || !hasSimplified || isTranslating}
              className={`w-full py-2.5 text-sm font-semibold ${isTranslating ? 'translate-loading' : ''}`}
              style={{
                fontFamily: 'Poppins, sans-serif',
                borderRadius: 'var(--radius-md)',
                background: isTranslating 
                  ? 'linear-gradient(90deg, #FC9FBE, #FEC192, #F7E799, #B3E97F, #C0FFF4, #FC9FBE)'
                  : selectedLanguage && hasSimplified 
                    ? 'var(--bubbles)' 
                    : '#d1d5db',
                backgroundSize: isTranslating ? '200% 100%' : undefined,
                animation: isTranslating ? 'rainbow-slide 2s linear infinite' : undefined,
                color: 'white',
                cursor: selectedLanguage && hasSimplified && !isTranslating ? 'pointer' : isTranslating ? 'wait' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage && hasSimplified && !isTranslating) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {isTranslating ? (
                <span>Translating...</span>
              ) : selectedLanguage ? (
                `Download ${SUPPORTED_LANGUAGES[selectedLanguage]} PDF`
              ) : (
                'Select a language'
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Animations */}
      <style jsx>{`
        @keyframes rainbow-slide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        .translate-loading {
          box-shadow: 0 0 15px rgba(255, 107, 107, 0.3), 
                      0 0 20px rgba(78, 205, 196, 0.2),
                      0 0 25px rgba(167, 139, 250, 0.15);
        }
      `}</style>
    </div>
  );
}
