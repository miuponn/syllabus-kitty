import SyllabusBackground from './SyllabusBackground';
import PawfessorLoading from './PawfessorLoading';

export default function SyllabusLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <SyllabusBackground />

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-4">
        <PawfessorLoading 
          variant="purple" 
          strokeColor="#7A47FF"
          size="large"
        />
      </div>
    </div>
  );
}
