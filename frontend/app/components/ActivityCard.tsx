'use client';

import { useState } from 'react';

interface ActivityCardProps {
  id: string;
  type: string;
  title: string;
  weight?: number;
  dateTime?: string;
  location?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ActivityCard({
  id,
  type,
  title,
  weight,
  dateTime,
  location,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete?.(id);
    }, 300);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      lecture: { bg: 'rgba(142, 138, 226, 0.15)', text: '#5a57b8', border: 'rgba(142, 138, 226, 0.4)' },
      assignment: { bg: 'rgba(252, 118, 255, 0.12)', text: '#c94acc', border: 'rgba(252, 118, 255, 0.35)' },
      exam: { bg: 'rgba(255, 120, 120, 0.12)', text: '#d65a5a', border: 'rgba(255, 120, 120, 0.35)' },
      lab: { bg: 'rgba(94, 185, 255, 0.15)', text: '#3a8fd1', border: 'rgba(94, 185, 255, 0.4)' },
      tutorial: { bg: 'rgba(166, 227, 161, 0.15)', text: '#4a9e47', border: 'rgba(166, 227, 161, 0.4)' },
      dgd: { bg: 'rgba(255, 176, 120, 0.15)', text: '#c97a3d', border: 'rgba(255, 176, 120, 0.4)' },
    };
    return colors[type.toLowerCase()] || { bg: 'rgba(108, 130, 255, 0.1)', text: '#5a6fd1', border: 'rgba(108, 130, 255, 0.3)' };
  };

  const typeColors = getTypeColor(type);

  return (
    <div
      className={`relative bg-white border-2 rounded-xl p-4 transition-all duration-300 ${
        isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        borderColor: isHovered ? 'rgba(94, 185, 255, 0.5)' : 'rgba(189, 219, 255, 0.4)',
        boxShadow: isHovered 
          ? '0 8px 24px rgba(94, 185, 255, 0.2)' 
          : '0 2px 8px rgba(108, 130, 255, 0.08)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <span 
          className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-full border-2"
          style={{
            fontFamily: 'Poppins, sans-serif',
            backgroundColor: typeColors.bg,
            color: typeColors.text,
            borderColor: typeColors.border,
          }}
        >
          {type.toUpperCase()}
        </span>

        {/* Edit/Delete buttons */}
        <div className={`flex gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onEdit?.(id)}
            className="p-1.5 sm:p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(54, 71, 169, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Edit"
          >
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5" 
              style={{ color: 'var(--dark)' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 sm:p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(252, 118, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Delete"
          >
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5" 
              style={{ color: 'var(--hotpinku)' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 
        className="font-semibold mb-2"
        style={{ 
          fontFamily: 'Urbanist, sans-serif',
          color: 'var(--dark)',
        }}
      >
        {title}
      </h4>

      {/* Details */}
      <div 
        className="space-y-1 text-sm"
        style={{ 
          fontFamily: 'Poppins, sans-serif',
          color: 'rgba(54, 71, 169, 0.7)',
        }}
      >
        {weight !== undefined && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{weight}%</span>
          </div>
        )}
        {dateTime && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{dateTime}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
