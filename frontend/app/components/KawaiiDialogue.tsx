'use client';

import { useState, ReactNode } from 'react';

interface KawaiiDialogueProps {
  phrases?: string[];
  children?: ReactNode;
}

const defaultPhrases = [
  "Feed me your syllabus!",
  "Let's organize your classes!",
  "I'm ready to help, meow!",
  "Drop that PDF here!",
  "Time to ace those courses!",
];

export default function KawaiiDialogue({ phrases = defaultPhrases, children }: KawaiiDialogueProps) {
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setCurrentPhrase(randomPhrase);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dialogue Bubble */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 transition-all duration-300 z-20 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div 
          className="relative px-6 py-3 rounded-2xl whitespace-nowrap"
          style={{
            background: 'rgba(255, 255, 255, 1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <p 
            className="text-xl sm:text-2xl font-semibold"
            style={{
              fontFamily: 'ViuCobacoba, display',
              color: 'var(--hotpinku)',
            }}
          >
            {currentPhrase}
          </p>
          {/* Speech bubble tail */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div 
              className="w-0 h-0"
              style={{
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '12px solid rgba(255, 255, 255, 1)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Children (Pawfessor image) */}
      {children}
    </div>
  );
}
