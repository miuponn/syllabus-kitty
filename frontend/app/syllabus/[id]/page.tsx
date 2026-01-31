'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PDFViewer from '../../components/PDFViewer';
import MenuBar from '../../components/MenuBar';
import AssessmentsList from '../../components/AssessmentsList';
import RecurringEventsList from '../../components/RecurringEventsList';

// Mock data for demonstration
const mockSyllabusData = {
  pdf_url: 'https://example.com/syllabus.pdf', // Replace with actual Supabase URL
  assessments: [
    {
      id: '1',
      type: 'assignment',
      title: 'Assignment 1: Introduction to React',
      weight: 15,
      due_date: '2024-02-15T23:59:00',
      description: 'Build a simple React app',
    },
    {
      id: '2',
      type: 'exam',
      title: 'Midterm Exam',
      weight: 30,
      due_date: '2024-03-20T10:00:00',
    },
    {
      id: '3',
      type: 'assignment',
      title: 'Assignment 2: State Management',
      weight: 20,
      due_date: '2024-04-10T23:59:00',
    },
  ],
  recurring_events: [
    {
      id: '1',
      type: 'lecture',
      title: 'Introduction to Web Development',
      day_of_week: 'Monday',
      start_time: '10:00',
      end_time: '11:30',
      location: 'SMD 224',
    },
    {
      id: '2',
      type: 'lecture',
      title: 'Advanced Topics in React',
      day_of_week: 'Wednesday',
      start_time: '10:00',
      end_time: '11:30',
      location: 'SMD 224',
    },
    {
      id: '3',
      type: 'lab',
      title: 'Hands-on Lab Session',
      day_of_week: 'Friday',
      start_time: '14:00',
      end_time: '16:00',
      location: 'SITE 5084',
    },
    {
      id: '4',
      type: 'dgd',
      title: 'Discussion Group A',
      day_of_week: 'Tuesday',
      start_time: '13:00',
      end_time: '14:00',
      location: 'MNO 2023',
    },
    {
      id: '5',
      type: 'tutorial',
      title: 'Tutorial Session 1',
      day_of_week: 'Thursday',
      start_time: '15:00',
      end_time: '16:00',
      location: 'CBY B302',
    },
  ],
};

export default function SyllabusPage() {
  const params = useParams();
  const syllabusId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [syllabusData, setSyllabusData] = useState(mockSyllabusData);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  useEffect(() => {
    // TODO: Fetch actual data from Supabase using syllabusId
    const fetchSyllabusData = async () => {
      try {
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/syllabus/${syllabusId}`);
        // const data = await response.json();
        // setSyllabusData(data);
        setTimeout(() => setIsLoading(false), 1000); // Mock loading
      } catch (error) {
        console.error('Error fetching syllabus:', error);
        setIsLoading(false);
      }
    };

    fetchSyllabusData();
  }, [syllabusId]);

  const handleAddAllToCalendar = async () => {
    setIsAddingToCalendar(true);
    try {
      // TODO: Call backend API to add all events to Google Calendar
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API call
      alert('All events added to Google Calendar!');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert('Failed to add events to calendar');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const handleTranslate = () => {
    alert('Translation feature coming soon!');
  };

  const handleScreenReader = () => {
    alert('Screen reader feature coming soon!');
  };

  const handleSimplify = () => {
    alert('Simplify feature coming soon!');
  };

  const handleEditAssessment = (id: string) => {
    console.log('Edit assessment:', id);
    // TODO: Implement edit functionality
  };

  const handleDeleteAssessment = (id: string) => {
    setSyllabusData(prev => ({
      ...prev,
      assessments: prev.assessments.filter(a => a.id !== id),
    }));
  };

  const handleEditEvent = (id: string) => {
    console.log('Edit event:', id);
    // TODO: Implement edit functionality
  };

  const handleDeleteEvent = (id: string) => {
    setSyllabusData(prev => ({
      ...prev,
      recurring_events: prev.recurring_events.filter(e => e.id !== id),
    }));
  };

  const handleAddNewAssessment = () => {
    alert('Add new assessment modal coming soon!');
  };

  const handleAddNewEvent = () => {
    alert('Add new event modal coming soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading syllabus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Menu Bar */}
        <MenuBar
          onTranslate={handleTranslate}
          onScreenReader={handleScreenReader}
          onSimplify={handleSimplify}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: PDF Viewer */}
          <div className="lg:col-span-1">
            <PDFViewer pdfUrl={syllabusData.pdf_url} />
          </div>

          {/* Right: Schedule & Assessments */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add to Calendar Button */}
            <button
              onClick={handleAddAllToCalendar}
              disabled={isAddingToCalendar}
              className="w-full py-4 bg-linear-to-r from-purple-600 via-pink-500 to-orange-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isAddingToCalendar ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding to Calendar...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add All to Google Calendar
                </>
              )}
            </button>

            {/* Assessments */}
            <AssessmentsList
              assessments={syllabusData.assessments}
              onEdit={handleEditAssessment}
              onDelete={handleDeleteAssessment}
              onAddNew={handleAddNewAssessment}
            />

            {/* Recurring Events */}
            <RecurringEventsList
              events={syllabusData.recurring_events}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onAddNew={handleAddNewEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
