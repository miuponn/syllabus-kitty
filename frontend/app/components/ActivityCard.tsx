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
    const colors: Record<string, string> = {
      lecture: 'bg-purple-100 text-purple-700 border-purple-300',
      assignment: 'bg-pink-100 text-pink-700 border-pink-300',
      exam: 'bg-red-100 text-red-700 border-red-300',
      lab: 'bg-blue-100 text-blue-700 border-blue-300',
      tutorial: 'bg-green-100 text-green-700 border-green-300',
      dgd: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div
      className={`relative bg-white border-2 rounded-xl p-4 transition-all duration-300 ${
        isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      } ${isHovered ? 'shadow-lg border-purple-300' : 'shadow-md border-gray-200'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${getTypeColor(type)}`}>
          {type.toUpperCase()}
        </span>

        {/* Edit/Delete buttons */}
        <div className={`flex gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onEdit?.(id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>

      {/* Details */}
      <div className="space-y-1 text-sm text-gray-600">
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
