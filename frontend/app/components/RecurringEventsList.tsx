'use client';

import { useState } from 'react';
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
  const maxVisible = 5;
  const visibleItems = isExpanded ? events : events.slice(0, maxVisible);
  const hasMore = events.length > maxVisible;

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
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Recurring Events</h2>
          <p className="text-sm text-gray-500 mt-1">{summary || 'No events'}</p>
        </div>
        <button
          onClick={onAddNew}
          className="px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          + Add New
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 relative">
        {visibleItems.map((event, index) => (
          <div
            key={event.id}
            className={`transition-opacity duration-500 ${
              !isExpanded && index >= maxVisible - 2 && hasMore ? 'opacity-40' : 'opacity-100'
            }`}
          >
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

        {/* Fade overlay */}
        {!isExpanded && hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 py-3 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isExpanded ? (
            <>
              Show Less
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              Show All ({events.length - maxVisible} more)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
