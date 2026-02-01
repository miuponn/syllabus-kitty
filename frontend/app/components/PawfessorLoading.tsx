'use client';

interface PawfessorLoadingProps {
  variant?: 'pink' | 'purple';
  strokeColor?: string;
  size?: 'default' | 'large';
}

export default function PawfessorLoading({ 
  variant = 'pink',
  strokeColor = '#C76585',
  size = 'default',
}: PawfessorLoadingProps) {
  const imageSrc = variant === 'pink' 
    ? '/assets/images/pawfessor-pink-side.png'
    : '/assets/images/purple-pawfessor-side.png';

  const imageClasses = size === 'large'
    ? 'w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain'
    : 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain';

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 w-full">
      {/* Pawfessor */}
      <div className="relative">
        {/* Pawfessor walking animation */}
        <div className="animate-pawfessor-walk">
          <img 
            src={imageSrc} 
            alt="Pawfessor" 
            className={imageClasses}
          />
        </div>
      </div>
      
      {/* Loading text with animated ellipses */}
      <div 
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl relative inline-block"
        style={{
          fontFamily: 'ViuCobacoba, display',
          color: 'white',
          WebkitTextStroke: `2px ${strokeColor}`,
          paintOrder: 'stroke fill',
        }}
      >
        loading
        <span 
          className="ellipsis-dots"
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '2rem',
            textAlign: 'left'
          }}
        >
          <style jsx>{`
            .ellipsis-dots::after {
              content: '';
              animation: ellipsis-cycle 2s steps(4, end) infinite;
            }
            
            @keyframes ellipsis-cycle {
              0%, 100% { content: ''; }
              25% { content: ' .'; }
              50% { content: ' . .'; }
              75% { content: ' . . .'; }
            }
          `}</style>
        </span>
      </div>
    </div>
  );
}
