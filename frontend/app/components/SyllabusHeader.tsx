import MenuBar from './MenuBar';

interface SyllabusHeaderProps {
  onTranslate?: () => void;
  onScreenReader?: () => void;
  onSimplify?: () => void;
}

export default function SyllabusHeader({ onTranslate, onScreenReader, onSimplify }: SyllabusHeaderProps) {
  return (
    <div className="mb-8">
      {/* Menu Bar */}
      <MenuBar
        onTranslate={onTranslate}
        onScreenReader={onScreenReader}
        onSimplify={onSimplify}
      />
      
      {/* Header */}
      <div className="text-center mt-6">
        <h1 className="text-5xl font-bingbong bg-gradient-darkpinku bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
          <span className="text-5xl">📚</span>
          Pawfessor's Analysis
          <span className="text-5xl">✨</span>
        </h1>
        <p className="text-medium-rose font-chewie text-lg">Your syllabus, organized and ready to conquer!</p>
      </div>
    </div>
  );
}
