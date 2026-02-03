'use client';

import UploadSection from './components/UploadSection';
import KawaiiDialogue from './components/KawaiiDialogue';

export default function Home() {
  return (
    <div className="min-h-screen relative pt-16 sm:pt-20">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated blobs */}
        <img 
          src="/assets/images/blur.svg" 
          alt="" 
          className="absolute top-20 left-10 w-64 h-64 opacity-60 animate-blob"
        />
        <img 
          src="/assets/images/blur2.svg" 
          alt="" 
          className="absolute bottom-20 right-10 w-96 h-96 opacity-60 animate-blob" 
          style={{ animationDelay: '2s' }}
        />
        <img 
          src="/assets/images/blur.svg" 
          alt="" 
          className="absolute top-1/2 left-1/2 w-80 h-80 opacity-50 animate-blob" 
          style={{ animationDelay: '4s' }}
        />
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-8 sm:px-16 md:px-24 lg:px-32 xl:px-40 py-12 sm:py-16">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 lg:gap-16 items-center">
          
          {/* LEFT COLUMN - Pawfessor */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Surrounding decorative elements with pink glow */}
              <img 
                src="/assets/images/twinkle-rough.svg" 
                alt="" 
                className="absolute -top-8 -right-8 w-12 h-12 lg:w-16 lg:h-16 animate-flicker opacity-70"
                style={{ 
                  filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                  animationDelay: '0s' 
                }}
              />
              <img 
                src="/assets/images/twinkle-rough.svg" 
                alt="" 
                className="absolute -bottom-12 -left-6 w-14 h-14 lg:w-20 lg:h-20 animate-flicker opacity-60"
                style={{ 
                  filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                  animationDelay: '1.5s' 
                }}
              />
              <img 
                src="/assets/images/twinkle-rough.svg" 
                alt="" 
                className="absolute top-1/3 -left-12 w-10 h-10 lg:w-12 lg:h-12 animate-flicker opacity-65"
                style={{ 
                  filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                  animationDelay: '0.8s' 
                }}
              />
              <img 
                src="/assets/images/circle-rough.svg" 
                alt="" 
                className="absolute bottom-1/4 -right-6 w-11 h-11 lg:w-14 lg:h-14 animate-flicker opacity-55"
                style={{ 
                  filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                  animationDelay: '2s' 
                }}
              />
              <img 
                src="/assets/images/circle-rough.svg" 
                alt="" 
                className="absolute top-1/4 right-6 w-8 h-8 lg:w-10 lg:h-10 animate-flicker opacity-50"
                style={{ 
                  filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                  animationDelay: '1.2s' 
                }}
              />

              {/* Pawfessor with KawaiiDialogue wrapper and dramatic hover animations */}
              <div className="relative w-full max-w-xs lg:max-w-sm xl:max-w-md mx-auto">
                <KawaiiDialogue>
                  <img 
                    src="/assets/images/pawfessor-pink.png" 
                    alt="Pawfessor" 
                    className="w-full h-auto relative z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-4 cursor-pointer"
                    style={{ 
                      filter: 'drop-shadow(0 4px 6px rgba(88, 151, 178, 0.4))',
                      animation: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.animation = 'wiggle 0.5s ease-in-out infinite';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.animation = 'none';
                    }}
                  />
                </KawaiiDialogue>

                {/* Hover twinkles that fade in/out */}
                <img 
                  src="/assets/images/twinkle-rough.svg" 
                  alt="" 
                  className="absolute -top-6 left-1/4 w-8 h-8 lg:w-10 lg:h-10 opacity-0 hover-twinkle"
                  style={{ 
                    filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                    transition: 'opacity 0.5s ease-in-out'
                  }}
                />
                <img 
                  src="/assets/images/twinkle-rough.svg" 
                  alt="" 
                  className="absolute bottom-6 right-1/3 w-9 h-9 lg:w-12 lg:h-12 opacity-0 hover-twinkle"
                  style={{ 
                    filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
                    transition: 'opacity 0.5s ease-in-out',
                    transitionDelay: '0.15s'
                  }}
                />

                <style jsx>{`
                  .relative:hover .hover-twinkle {
                    opacity: 1 !important;
                    animation: flicker 1.5s ease-in-out infinite;
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Header & Upload */}
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="relative w-full flex justify-center">
              <div className="relative group transition-transform duration-500 hover:scale-105">
                <img 
                  src="/assets/images/header.png" 
                  alt="Syllabus Kitty" 
                  className="h-20 sm:h-28 md:h-32 lg:h-40 xl:h-44 w-auto"
                  style={{ 
                    filter: 'drop-shadow(0 0 20px #FFB2E1) drop-shadow(0 3px 5px rgba(88, 151, 178, 0.3))'
                  }}
                />
                {/* Sparkle with pink glow and pulse at top right */}
                <img 
                  src="/assets/images/sparkles.svg" 
                  alt="" 
                  className="absolute -right-5 -top-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-pulse-glow"
                  style={{ 
                    filter: 'brightness(0) invert(1) drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)'
                  }}
                />
              </div>
            </div>

            {/* Tagline */}
            <p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-center px-4"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: '#C76585'
              }}
            >
              Syllabus to schedule in just one click
            </p>

            {/* Upload Section */}
            <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl px-6 sm:px-8">
              <UploadSection />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
