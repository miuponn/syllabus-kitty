import SyllabusBackground from './SyllabusBackground';

export default function SyllabusLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <SyllabusBackground />

      <div className="text-center relative z-10">
        <div className="w-20 h-20 border-4 border-hotpinku border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-dark font-poppins font-semibold text-xl">Loading your syllabus...</p>
      </div>
    </div>
  );
}
