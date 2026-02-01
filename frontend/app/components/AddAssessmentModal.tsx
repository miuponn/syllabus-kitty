'use client';

import { useState, useEffect } from 'react';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (assessment: any) => void;
}

export default function AddAssessmentModal({
  isOpen,
  onClose,
  onAdd,
}: AddAssessmentModalProps) {
  const [formData, setFormData] = useState({
    type: 'assignment',
    title: '',
    weight: 0,
    due_date: '',
    description: '',
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAssessment = {
      id: `new_${Date.now()}`,
      ...formData,
    };
    onAdd(newAssessment);
    // Reset form
    setFormData({
      type: 'assignment',
      title: '',
      weight: 0,
      due_date: '',
      description: '',
    });
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const inputStyles = {
    fontFamily: 'Poppins, sans-serif',
    color: 'var(--dark)',
    borderColor: 'rgba(189, 219, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${
        isVisible ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl transition-all duration-300 transform ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ boxShadow: '0 8px 32px rgba(108, 130, 255, 0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-5">
          <img 
            src="/assets/images/notebook.png" 
            alt="" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
          <h2 
            className="text-xl sm:text-2xl font-bold"
            style={{ 
              fontFamily: 'Urbanist, sans-serif',
              color: 'var(--dark)',
            }}
          >
            Add New Assessment
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 176, 120, 0.8)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 176, 120, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 176, 120, 0.8)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 176, 120, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Weight (%)
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 176, 120, 0.8)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 176, 120, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
              min="0"
              max="100"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Due Date
            </label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value + ':00' })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 176, 120, 0.8)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 176, 120, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none resize-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 176, 120, 0.8)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 176, 120, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                fontWeight: 600,
                color: 'var(--dark)',
                borderColor: 'rgba(189, 219, 255, 0.6)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(189, 219, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 sm:py-3 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                fontWeight: 600,
                background: 'var(--gradient-goldy)',
                backgroundSize: '200% 200%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.animation = 'gradient-shift 2s ease infinite';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animation = 'none';
              }}
            >
              Add Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
