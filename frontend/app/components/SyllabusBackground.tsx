export default function SyllabusBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <img src="/assets/images/blur.svg" alt="" className="absolute top-20 left-10 w-64 h-64 opacity-60 animate-blob" />
      <img src="/assets/images/blur2.svg" alt="" className="absolute bottom-20 right-10 w-96 h-96 opacity-60 animate-blob" style={{ animationDelay: '2s' }} />
      <img src="/assets/images/blur.svg" alt="" className="absolute top-1/2 left-1/2 w-80 h-80 opacity-50 animate-blob" style={{ animationDelay: '4s' }} />

      {/* Sparkles */}
      <img src="/assets/images/sparkles.svg" alt="" className="absolute top-32 right-20 w-8 h-8 animate-flicker opacity-40" />
      <img src="/assets/images/sparkles.svg" alt="" className="absolute bottom-40 left-32 w-6 h-6 animate-flicker opacity-40" style={{ animationDelay: '1s' }} />
      <img src="/assets/images/twinkle-rough.svg" alt="" className="absolute top-1/3 right-1/3 w-12 h-12 animate-float opacity-30" />
      
      {/* Paws */}
      <img src="/assets/images/paw 2.svg" alt="" className="absolute top-1/4 left-20 w-6 h-6 opacity-15 animate-float" />
      <img src="/assets/images/paw 4.svg" alt="" className="absolute bottom-1/3 right-40 w-8 h-8 opacity-15 animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
}
