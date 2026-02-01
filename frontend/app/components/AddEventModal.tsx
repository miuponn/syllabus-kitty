'use client';

import { useState, useEffect } from 'react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: any) => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  onAdd,
}: AddEventModalProps) {
  const [formData, setFormData] = useState({
    type: 'lecture',
    title: '',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = {
      id: `new_${Date.now()}`,
      ...formData,
    };
    onAdd(newEvent);
    // Reset form
    setFormData({
      type: 'lecture',
      title: '',
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:00',
      location: '',
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

  const focusColor = 'rgba(142, 138, 226, 0.8)';
  const focusShadow = '0 0 0 3px rgba(142, 138, 226, 0.2)';

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
            src="/assets/images/calendar2.png" 
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
            Add New Recurring Event
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
                e.target.style.borderColor = focusColor;
                e.target.style.boxShadow = focusShadow;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
              <option value="tutorial">Tutorial</option>
              <option value="dgd">DGD</option>
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
                e.target.style.borderColor = focusColor;
                e.target.style.boxShadow = focusShadow;
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
              Day of Week
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = focusColor;
                e.target.style.boxShadow = focusShadow;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
              required
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label 
                className="block text-sm font-medium mb-1.5"
                style={{ 
                  fontFamily: 'Urbanist, sans-serif',
                  color: 'var(--dark)',
                }}
              >
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
                style={inputStyles}
                onFocus={(e) => {
                  e.target.style.borderColor = focusColor;
                  e.target.style.boxShadow = focusShadow;
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
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
                style={inputStyles}
                onFocus={(e) => {
                  e.target.style.borderColor = focusColor;
                  e.target.style.boxShadow = focusShadow;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none"
              style={inputStyles}
              onFocus={(e) => {
                e.target.style.borderColor = focusColor;
                e.target.style.boxShadow = focusShadow;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(189, 219, 255, 0.6)';
                e.target.style.boxShadow = 'none';
              }}
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
                background: 'var(--gradient-accent)',
                backgroundSize: '200% 200%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.animation = 'gradient-shift 2s ease infinite';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animation = 'none';
              }}
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
