import UploadSection from './components/UploadSection';
import AuthButton from './components/AuthButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4 relative">
            <div className="absolute right-0 top-0">
              <AuthButton />
            </div>
            <span className="text-6xl" role="img" aria-label="cat">🐱</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Syllabus Kitty
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your syllabus PDF and let AI extract all the important details—class schedules, assignments, and more!
          </p>
        </header>

        {/* Upload Section */}
        <UploadSection />
      </main>
    </div>
  );
}
