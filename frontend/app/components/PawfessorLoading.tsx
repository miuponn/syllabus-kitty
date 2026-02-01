'use client';

interface PawfessorLoadingProps {
  variant?: 'pink' | 'purple';
  strokeColor?: string;
}

export default function PawfessorLoading({ 
  variant = 'pink',
  strokeColor = '#C76585'
}: PawfessorLoadingProps) {
  const imageSrc = variant === 'pink' 
    ? '/assets/images/pawfessor-pink-side.png'
    : '/assets/images/purple-pawfessor-side.png';

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Pawfessor walking animation */}
      <div className="animate-pawfessor-walk">
        <img 
          src={imageSrc} 
          alt="Pawfessor" 
          className="w-32 h-32 object-contain"
        />
      </div>
      
      {/* Loading text with animated ellipses */}
      <div 
        className="text-4xl relative inline-block"
        style={{
          fontFamily: 'ViuCobacoba, display',
          color: 'white',
          WebkitTextStroke: `3px ${strokeColor}`,
          paintOrder: 'stroke fill',
        }}
      >
        loading
        <span 
          className="ellipsis-dots"
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '3rem',
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
