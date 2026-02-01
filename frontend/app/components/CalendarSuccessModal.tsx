'use client';

import { useEffect, useState } from 'react';

interface CalendarSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsAdded: number;
  courseName?: string;
}

export default function CalendarSuccessModal({
  isOpen,
  onClose,
  eventsAdded,
  courseName = 'your course'
}: CalendarSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <img 
                src={`/assets/images/paw ${(i % 5) + 1}.svg`}
                alt=""
                className="w-6 h-6 opacity-80"
                style={{
                  filter: `hue-rotate(${Math.random() * 360}deg)`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
          {/* Sparkles */}
          {[...Array(15)].map((_, i) => (
            <img
              key={`sparkle-${i}`}
              src="/assets/images/sparkles.svg"
              alt=""
              className="absolute w-8 h-8 animate-sparkle-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Modal content */}
      <div 
        className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-modal-bounce"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
          boxShadow: '0 25px 50px -12px rgba(252, 118, 255, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top gradient */}
        <div 
          className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl"
          style={{ background: 'var(--gradient-peach)' }}
        />
        
        {/* Pawfessor celebration */}
        <div className="flex justify-center mb-4 -mt-2">
          <div className="relative">
            <img 
              src="/assets/images/pawfessor-pink.png" 
              alt="Pawfessor celebrating" 
              className="w-28 h-28 object-contain animate-bounce-slow"
            />
            {/* Sparkle decorations */}
            <img 
              src="/assets/images/sparkles.svg" 
              alt="" 
              className="absolute -top-2 -right-2 w-8 h-8 animate-pulse"
            />
            <img 
              src="/assets/images/twinkle-rough.svg" 
              alt="" 
              className="absolute -bottom-1 -left-3 w-6 h-6 animate-flicker"
            />
          </div>
        </div>
        
        {/* Success message */}
        <div className="text-center">
          <h2 
            className="text-3xl mb-2"
            style={{ 
              fontFamily: 'Chewie, sans-serif',
              color: 'var(--pink-body)',
            }}
          >
            Purrfect!
          </h2>
          
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ 
              background: 'var(--gradient-success)',
            }}
          >
            <img src="/assets/images/calendar2.png" alt="" className="w-6 h-6" />
            <span 
              className="text-lg font-semibold"
              style={{ color: 'var(--dark)' }}
            >
              {eventsAdded} event{eventsAdded !== 1 ? 's' : ''} added
            </span>
          </div>
          
          <p 
            className="text-base mb-6"
            style={{ color: 'var(--blue-body)' }}
          >
            All your deadlines and classes from <strong>{courseName}</strong> are now in your Google Calendar!
          </p>
          
          {/* Visual calendar preview */}
          <div 
            className="rounded-2xl p-4 mb-6"
            style={{ 
              background: 'linear-gradient(135deg, var(--bubbles) 0%, var(--blueberry) 100%)',
              border: '2px solid var(--notebook-outline)',
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white">
                  <img src="/assets/images/notebook.svg" alt="" className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white">
                  <img src="/assets/images/calendar2.png" alt="" className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white">
                  <span style={{ fontSize: '20px' }}>✓</span>
                </div>
              </div>
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--dark)' }}
              >
                Synced with Google Calendar
              </span>
            </div>
          </div>
          
          {/* Tip */}
          <div 
            className="flex items-start gap-3 text-left p-3 rounded-xl"
            style={{ background: 'var(--lemon)', opacity: 0.9 }}
          >
            <img src="/assets/images/sparkles2.svg" alt="" className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm" style={{ color: 'var(--dark)' }}>
              <strong>Tip:</strong> Check your Google Calendar app to see all your upcoming deadlines and class times!
            </p>
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95"
          style={{ 
            background: 'var(--gradient-peach)',
            fontFamily: 'Chewie, sans-serif',
          }}
        >
          Awesome!
        </button>
        
        {/* Decorative paws in corners */}
        <img 
          src="/assets/images/paw 1.svg" 
          alt="" 
          className="absolute -bottom-3 -left-3 w-10 h-10 opacity-30 rotate-[-20deg]"
        />
        <img 
          src="/assets/images/paw 2.svg" 
          alt="" 
          className="absolute -bottom-3 -right-3 w-10 h-10 opacity-30 rotate-[20deg]"
        />
      </div>
      
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes modal-bounce {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes sparkle-float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-confetti {
          animation: confetti linear forwards;
        }
        
        .animate-modal-bounce {
          animation: modal-bounce 0.4s ease-out forwards;
        }
        
        .animate-sparkle-float {
          animation: sparkle-float 2s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
