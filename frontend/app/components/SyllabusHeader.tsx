'use client';

import { useState } from 'react';
import TranslateDropdown from './TranslateDropdown';

interface SyllabusHeaderProps {
  onTranslate?: (languageCode: string) => Promise<void>;
  onScreenReader?: () => void;
  onSimplify?: () => void;
  isTranslating?: boolean;
  hasSimplified?: boolean;
}

export default function SyllabusHeader({ 
  onTranslate, 
  onScreenReader, 
  onSimplify,
  isTranslating = false,
  hasSimplified = false,
}: SyllabusHeaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Button styles - filled default, white hover with colored text
  const getButtonStyle = (color: string) => ({
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: `2px solid ${color}`,
    color: 'white',
    backgroundColor: color,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  });

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, color: string) => {
    const btn = e.currentTarget;
    btn.style.backgroundColor = 'white';
    btn.style.borderColor = color;
    btn.style.color = color;
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>, color: string) => {
    const btn = e.currentTarget;
    btn.style.backgroundColor = color;
    btn.style.borderColor = color;
    btn.style.color = 'white';
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = 'none';
  };

  const handleButtonActive = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = 'scale(0.95)';
    btn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2) inset';
    btn.style.filter = 'brightness(0.95)';
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Row above header with pawfessor left and sparkles right */}
      <div className="flex items-end justify-between px-2 sm:px-4 md:px-6 -mb-1">
        {/* Pawfessor with speech bubble - left aligned */}
        <div 
          className="relative flex items-end"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img 
            src="/assets/images/pawfessor-head.png" 
            alt="Pawfessor" 
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain cursor-pointer"
            style={{
              animation: isHovered ? 'wiggle 0.5s ease-in-out infinite' : 'none',
            }}
          />
          {/* Speech bubble - to the right of pawfessor */}
          <div 
            className="relative ml-2 sm:ml-3 mb-4 sm:mb-6"
            style={{
              background: 'rgba(255, 255, 255, 1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.5rem 1rem',
              animationName: isHovered ? 'wiggle' : 'none',
              animationDuration: '0.5s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: '0.1s',
            }}
          >
            <p 
              className="text-base sm:text-lg md:text-xl font-semibold whitespace-nowrap"
              style={{
                fontFamily: 'ViuCobacoba, display',
                color: 'var(--purple-body)',
              }}
            >
              Pawfessor's analysis!
            </p>
            {/* Speech bubble tail pointing left */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2"
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '10px solid rgba(255, 255, 255, 1)'
              }}
            />
          </div>
        </div>

        {/* Sparkles - right aligned with pulsing pink glow */}
        <img 
          src="/assets/images/sparkles.svg" 
          alt="" 
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mb-2 sm:mb-3 animate-pulse-glow"
          style={{
            filter: 'brightness(0) invert(1) drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)'
          }}
        />
      </div>

      {/* Main Header Bar */}
      <div 
        className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 px-4 sm:px-6 md:px-8 py-3 sm:py-4"
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-full)',
          border: '4px solid var(--blueberry)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Left: Header with icon */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <img 
            src="/assets/images/glass.png" 
            alt="" 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain"
          />
          <h1 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl"
            style={{
              fontFamily: 'Chewie, display',
              fontWeight: 800,
              background: 'var(--gradient-gem)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Class Overview
          </h1>
          <img 
            src="/assets/images/sparkles2.svg" 
            alt="" 
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
            style={{
              filter: 'brightness(0) saturate(100%) invert(89%) sepia(25%) saturate(1057%) hue-rotate(132deg) brightness(99%) contrast(95%)'
            }}
          />
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Translate Dropdown - Bubbles color */}
          <TranslateDropdown
            onTranslate={onTranslate || (async () => {})}
            isTranslating={isTranslating}
            hasSimplified={hasSimplified}
          />

          {/* Screen Reader Button - Lime color */}
          <button
            onClick={onScreenReader}
            className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-sm sm:text-base"
            style={getButtonStyle('var(--lime)')}
            onMouseEnter={(e) => handleButtonHover(e, 'var(--lime)')}
            onMouseLeave={(e) => handleButtonLeave(e, 'var(--lime)')}
            onMouseDown={handleButtonActive}
            onMouseUp={(e) => handleButtonHover(e, 'var(--lime)')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            Screen Reader
          </button>

          {/* Simplify Button - Orang color */}
          <button
            onClick={onSimplify}
            className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-sm sm:text-base"
            style={getButtonStyle('var(--orang)')}
            onMouseEnter={(e) => handleButtonHover(e, 'var(--orang)')}
            onMouseLeave={(e) => handleButtonLeave(e, 'var(--orang)')}
            onMouseDown={handleButtonActive}
            onMouseUp={(e) => handleButtonHover(e, 'var(--orang)')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Simplify
          </button>
        </div>
      </div>

      {/* Wiggle animation keyframes */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
