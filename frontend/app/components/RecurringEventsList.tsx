'use client';

import { useState, useRef, useEffect } from 'react';
import ActivityCard from './ActivityCard';

interface RecurringEvent {
  id: string;
  type: string;
  title: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

interface RecurringEventsListProps {
  events: RecurringEvent[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddNew?: () => void;
}

export default function RecurringEventsList({ events, onEdit, onDelete, onAddNew }: RecurringEventsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxVisible = 5;
  const visibleItems = isExpanded ? events : events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;

  // Calculate content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [events, isExpanded]);

  const collapsedHeight = Math.min(events.length, maxVisible) * 100; // Approximate height per card

  // Count by type
  const counts = events.reduce((acc, event) => {
    const type = event.type.toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = Object.entries(counts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

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
              src="/assets/images/calendar2.png" 
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
              Recurring Events
            </h2>
            <p 
              className="text-sm sm:text-base font-bold mt-0.5"
              style={{ 
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--persimmon)',
              }}
            >
              {summary || 'No events'}
            </p>
          </div>
        </div>
        <button
          onClick={onAddNew}
          className="gradient-button px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
          style={{ 
            '--gradient': 'var(--gradient-accent)',
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
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : `${collapsedHeight}px`,
        }}
      >
        <div ref={contentRef} className="space-y-3">
          {visibleItems.map((event) => (
            <div key={event.id}>
              <ActivityCard
                id={event.id}
                type={event.type}
                title={event.title}
                dateTime={`${event.day_of_week} ${event.start_time} - ${event.end_time}`}
                location={event.location}
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
              Show All ({events.length - maxVisible} more)
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
