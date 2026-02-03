'use client';

import { useState, useRef } from 'react';
import ActivityCard from './ActivityCard';

interface Assessment {
  id: string;
  type: string;
  title: string;
  weight: number;
  due_date: string;
  description?: string;
}

interface AssessmentsListProps {
  assessments: Assessment[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddNew?: () => void;
}

const CARD_HEIGHT = 90; 
const GAP_HEIGHT = 12; 

export default function AssessmentsList({ assessments, onEdit, onDelete, onAddNew }: AssessmentsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxVisible = 5;
  const hasMore = assessments.length > maxVisible;

  // Calculate heights for smooth animation
  const calculateHeight = (itemCount: number) => {
    if (itemCount === 0) return 0;
    return (CARD_HEIGHT * itemCount) + (GAP_HEIGHT * (itemCount - 1));
  };

  const collapsedHeight = calculateHeight(Math.min(assessments.length, maxVisible));
  const expandedHeight = calculateHeight(assessments.length);
  // Only constrain height if there are more items than maxVisible
  const currentHeight = hasMore ? (isExpanded ? expandedHeight : collapsedHeight) : undefined;

  return (
    <div 
      className="frosted-glass rounded-2xl shadow-lg p-4 sm:p-6"
      style={{
        boxShadow: '0 4px 20px rgba(108, 130, 255, 0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <img 
              src="/assets/images/notebook.png" 
              alt="" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          </div>
          {/* Title and count */}
          <div>
            <h2 
              className="text-base sm:text-lg md:text-xl font-bold"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
              }}
            >
              Assessments
            </h2>
            <p 
              className="text-sm sm:text-base font-bold mt-0.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--persimmon)',
              }}
            >
              {assessments.length} {assessments.length === 1 ? 'assessment' : 'assessments'}
            </p>
          </div>
        </div>
        <button
          onClick={onAddNew}
          className="gradient-button px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
          style={{ 
            '--gradient': 'var(--gradient-goldy)',
            '--roundness': 'var(--radius-lg)',
            fontFamily: 'Urbanist, sans-serif',
          } as React.CSSProperties}
        >
          + Add New
        </button>
      </div>

      {/* List with smooth height transition */}
      <div 
        className="relative overflow-hidden transition-all duration-500 ease-in-out"
        style={currentHeight !== undefined ? { height: `${currentHeight}px` } : {}}
      >
        <div ref={contentRef} className="space-y-3">
          {assessments.map((assessment) => (
            <div key={assessment.id}>
              <ActivityCard
                id={assessment.id}
                type={assessment.type}
                title={assessment.title}
                dateTime={new Date(assessment.due_date).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>

        {/* Fade overlay */}
        {!isExpanded && hasMore && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.9), transparent)',
            }}
          />
        )}
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
          style={{
            fontFamily: 'Urbanist, sans-serif',
            color: 'var(--dark)',
            background: 'rgba(189, 219, 255, 0.3)',
          }}
        >
          {isExpanded ? (
            <>
              Show Less
              <svg 
                className="w-4 h-4 transition-transform duration-300"
                style={{ transform: 'rotate(180deg)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          ) : (
            <>
              Show All ({assessments.length - maxVisible} more)
              <svg 
                className="w-4 h-4 transition-transform duration-300"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
