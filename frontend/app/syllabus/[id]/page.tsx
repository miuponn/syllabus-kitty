'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { createClient } from '@/app/lib/supabaseClient';
import PDFViewer from '../../components/PDFViewer';
import SyllabusHeader from '../../components/SyllabusHeader';
import AssessmentsList from '../../components/AssessmentsList';
import RecurringEventsList from '../../components/RecurringEventsList';
import EditAssessmentModal from '../../components/EditAssessmentModal';
import EditEventModal from '../../components/EditEventModal';
import AddAssessmentModal from '../../components/AddAssessmentModal';
import AddEventModal from '../../components/AddEventModal';

// Helper function to extract day of week from recurrence rule
function parseDayFromRRule(recurrence?: string[]): string {
  if (!recurrence || recurrence.length === 0) return 'Unknown';
  const match = recurrence[0].match(/BYDAY=([A-Z,]+)/);
  if (!match) return 'Unknown';
  const days = match[1].split(',');
  const dayMap: Record<string, string> = {
    MO: 'Monday',
    TU: 'Tuesday',
    WE: 'Wednesday',
    TH: 'Thursday',
    FR: 'Friday',
    SA: 'Saturday',
    SU: 'Sunday',
  };
  return days.map(d => dayMap[d] || d).join(', ');
}

// Helper to format time from ISO string
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toTimeString().slice(0, 5); // HH:MM
}

// Helper to determine event type from summary
function getEventType(summary: string): string {
  const lower = summary.toLowerCase();
  if (lower.includes('lecture')) return 'lecture';
  if (lower.includes('lab')) return 'lab';
  if (lower.includes('tutorial')) return 'tutorial';
  if (lower.includes('dgd')) return 'dgd';
  return 'other';
}

// Helper to determine assessment type
function getAssessmentType(summary: string): string {
  const lower = summary.toLowerCase();
  if (lower.includes('exam')) return 'exam';
  if (lower.includes('quiz')) return 'quiz';
  if (lower.includes('project')) return 'project';
  if (lower.includes('assignment')) return 'assignment';
  return 'other';
}

// Helper to extract weight from summary
function extractWeight(summary: string, description: string): number {
  const match = (summary + ' ' + description).match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

export default function SyllabusPage() {
  const params = useParams();
  const { getTokens } = useAuth();
  const syllabusId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [calendarJson, setCalendarJson] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<any[]>([]);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  
  // Modal state
  const [editAssessmentModal, setEditAssessmentModal] = useState<{
    isOpen: boolean;
    assessment: any | null;
  }>({ isOpen: false, assessment: null });
  
  const [editEventModal, setEditEventModal] = useState<{
    isOpen: boolean;
    event: any | null;
  }>({ isOpen: false, event: null });
  
  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);

  useEffect(() => {
    const fetchSyllabusData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch PDF URL from sillabi table
        const { data: syllabiData, error: syllabiError } = await supabase
          .from('sillabi')
          .select('pdf_url, course_name')
          .eq('file_id', syllabusId)
          .single();
        
        if (syllabiError) {
          console.error('Error fetching PDF:', syllabiError);
        } else if (syllabiData) {
          setPdfUrl(syllabiData.pdf_url || '');
          console.log('Fetched PDF URL:', syllabiData.pdf_url);
        }
        
        // Fetch all event_json rows for this syllabus_id
        // Each row contains one event in event_json
        const { data, error } = await supabase
          .from('calendar_items')
          .select('id, event_json, type')
          .eq('syllabus_id', syllabusId);
        
        if (error) {
          console.error('Supabase error:', error);
          throw new Error('Failed to fetch syllabus data from Supabase');
        }
        
        console.log('Fetched rows from Supabase:', data);
        
        // Combine all event_json objects into an array
        const events = data?.map(row => row.event_json) || [];
        setCalendarJson(events);
        
        // Parse Google Calendar events into assessments and recurring events
        const parsedAssessments: any[] = [];
        const parsedRecurringEvents: any[] = [];
        
        data?.forEach((row: any, index: number) => {
          const event = row.event_json;
          const id = `event_${row.id}`; // Use the database ID
          const summary = event.summary || 'Untitled Event';
          const description = event.description || '';
          const startDateTime = event.start?.dateTime || event.start?.date;
          const rowType = row.type; // 'assessment' or 'recurring_event' from database
          
          // Use the type from database or check for recurrence
          if (rowType === 'recurring_event' || (event.recurrence && event.recurrence.length > 0)) {
            // It's a recurring event (lecture, lab, etc.)
            const dayOfWeek = parseDayFromRRule(event.recurrence);
            const startTime = startDateTime ? formatTime(startDateTime) : '';
            const endTime = event.end?.dateTime ? formatTime(event.end.dateTime) : '';
            const location = event.location || '';
            
            parsedRecurringEvents.push({
              id,
              dbId: row.id,
              type: getEventType(summary),
              title: summary,
              day_of_week: dayOfWeek,
              start_time: startTime,
              end_time: endTime,
              location,
              originalEvent: event, // Keep original for reference
            });
          } else {
            // It's a one-time event (assessment)
            const weight = extractWeight(summary, description);
            const dueDate = startDateTime || '';
            
            parsedAssessments.push({
              id,
              dbId: row.id,
              type: getAssessmentType(summary),
              title: summary,
              weight,
              due_date: dueDate,
              description,
              originalEvent: event, // Keep original for reference
            });
          }
        });
        
        console.log('Parsed Assessments:', parsedAssessments);
        console.log('Parsed Recurring Events:', parsedRecurringEvents);
        
        setAssessments(parsedAssessments);
        setRecurringEvents(parsedRecurringEvents);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching syllabus:', error);
        setIsLoading(false);
      }
    };

    fetchSyllabusData();
  }, [syllabusId]);

  // Helper function to save event_json to Supabase for a specific row
  const saveToSupabase = async (dbId: number, eventJson: any) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('calendar_items')
        .update({
          event_json: eventJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbId);
      
      if (error) {
        console.error('Error saving to Supabase:', error);
        throw error;
      }
      
      console.log('Successfully saved to Supabase');
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
      alert('Failed to save changes to database');
    }
  };

  const handleAddAllToCalendar = async () => {
    setIsAddingToCalendar(true);
    try {
      const { supabaseToken, googleAccessToken, googleRefreshToken } = await getTokens();
      
      console.log('Tokens retrieved:', {
        supabase: supabaseToken ? 'present' : 'missing',
        googleAccess: googleAccessToken ? 'present' : 'missing',
        googleRefresh: googleRefreshToken ? 'present' : 'missing',
      });
      
      if (!googleAccessToken) {
        alert('Please sign in with Google to add events to your calendar');
        setIsAddingToCalendar(false);
        return;
      }
      
      // event_json is already saved to Supabase from CRUD operations
      // Now add all events to Google Calendar
      const response = await fetch(`http://localhost:8000/api/syllabus/${syllabusId}/add-to-calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseToken}`,
          'X-Google-Access-Token': googleAccessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: calendarJson }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add events to calendar');
      }
      
      const result = await response.json();
      alert(`Successfully added ${result.events_added || 'all'} events to Google Calendar!`);
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert(error instanceof Error ? error.message : 'Failed to add events to calendar');
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
    const assessment = assessments.find(a => a.id === id);
    if (assessment) {
      setEditAssessmentModal({ isOpen: true, assessment });
    }
  };
  
  const handleSaveAssessment = async (updatedAssessment: any) => {
    // Update local state
    setAssessments(prev => 
      prev.map(a => a.id === updatedAssessment.id ? updatedAssessment : a)
    );
    
    // Update the Google Calendar event format and save to Supabase
    const updatedEvent = {
      summary: updatedAssessment.title,
      description: updatedAssessment.description,
      start: {
        dateTime: updatedAssessment.due_date,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: new Date(new Date(updatedAssessment.due_date).getTime() + 3600000).toISOString(),
        timeZone: 'America/Toronto',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };
    
    console.log('Updated event_json after edit:', updatedEvent);
    
    // Save to Supabase immediately
    await saveToSupabase(updatedAssessment.dbId, updatedEvent);
  };

  const handleDeleteAssessment = async (id: string) => {
    const assessment = assessments.find(a => a.id === id);
    if (!assessment) return;
    
    // Delete from Supabase
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('id', assessment.dbId);
      
      if (error) {
        console.error('Error deleting from Supabase:', error);
        alert('Failed to delete event');
        return;
      }
      
      // Update local state only after successful deletion
      setAssessments(prev => prev.filter(a => a.id !== id));
      console.log('Successfully deleted assessment');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete event');
    }
  };

  const handleEditEvent = (id: string) => {
    const event = recurringEvents.find(e => e.id === id);
    if (event) {
      setEditEventModal({ isOpen: true, event });
    }
  };
  
  const handleSaveEvent = async (updatedEvent: any) => {
    // Update local state
    setRecurringEvents(prev => 
      prev.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    );
    
    // Construct date/time for recurring event
    const today = new Date().toISOString().split('T')[0];
    const startDateTime = `${today}T${updatedEvent.start_time}:00`;
    const endDateTime = `${today}T${updatedEvent.end_time}:00`;
    
    const updatedCalendarEvent = {
      summary: updatedEvent.title,
      location: updatedEvent.location,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Toronto',
      },
      recurrence: updatedEvent.originalEvent?.recurrence || [],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 30 }],
      },
    };
    
    console.log('Updated event_json after edit:', updatedCalendarEvent);
    
    // Save to Supabase immediately
    await saveToSupabase(updatedEvent.dbId, updatedCalendarEvent);
  };

  const handleDeleteEvent = async (id: string) => {
    const event = recurringEvents.find(e => e.id === id);
    if (!event) return;
    
    // Delete from Supabase
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('id', event.dbId);
      
      if (error) {
        console.error('Error deleting from Supabase:', error);
        alert('Failed to delete event');
        return;
      }
      
      // Update local state only after successful deletion
      setRecurringEvents(prev => prev.filter(e => e.id !== id));
      console.log('Successfully deleted event');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete event');
    }
  };

  const handleAddNewAssessment = () => {
    setAddAssessmentModalOpen(true);
  };
  
  const handleAddAssessment = async (newAssessment: any) => {
    // Create Google Calendar event format
    const newEvent = {
      summary: newAssessment.title,
      description: newAssessment.description,
      start: {
        dateTime: newAssessment.due_date,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: new Date(new Date(newAssessment.due_date).getTime() + 3600000).toISOString(),
        timeZone: 'America/Toronto',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };
    
    // Insert into Supabase
    try {
      const { getTokens } = useAuth();
      const { supabaseToken } = await getTokens();
      const session = await createClient().auth.getSession();
      const userId = session.data.session?.user?.id;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({
          user_id: userId,
          syllabus_id: syllabusId,
          type: 'assessment',
          event_json: newEvent,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting to Supabase:', error);
        alert('Failed to add event');
        return;
      }
      
      // Update local state with the new database ID
      const assessmentWithDbId = {
        ...newAssessment,
        dbId: data.id,
        id: `event_${data.id}`,
      };
      setAssessments(prev => [...prev, assessmentWithDbId]);
      console.log('Successfully added assessment');
    } catch (error) {
      console.error('Failed to add:', error);
      alert('Failed to add event');
    }
  };

  const handleAddNewEvent = () => {
    setAddEventModalOpen(true);
  };
  
  const handleAddEvent = async (newEvent: any) => {
    // Construct date/time for recurring event
    const today = new Date().toISOString().split('T')[0];
    const startDateTime = `${today}T${newEvent.start_time}:00`;
    const endDateTime = `${today}T${newEvent.end_time}:00`;
    
    // Create Google Calendar event format with recurrence
    const newCalendarEvent = {
      summary: newEvent.title,
      location: newEvent.location,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Toronto',
      },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${newEvent.day_of_week.substring(0, 2).toUpperCase()}`],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
    };
    
    // Insert into Supabase
    try {
      const session = await createClient().auth.getSession();
      const userId = session.data.session?.user?.id;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({
          user_id: userId,
          syllabus_id: syllabusId,
          type: 'recurring_event',
          event_json: newCalendarEvent,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting to Supabase:', error);
        alert('Failed to add event');
        return;
      }
      
      // Update local state with the new database ID
      const eventWithDbId = {
        ...newEvent,
        dbId: data.id,
        id: `event_${data.id}`,
      };
      setRecurringEvents(prev => [...prev, eventWithDbId]);
      console.log('Successfully added event');
    } catch (error) {
      console.error('Failed to add:', error);
      alert('Failed to add event');
    }
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
        {/* Header with Menu Bar */}
        <SyllabusHeader
          onTranslate={handleTranslate}
          onScreenReader={handleScreenReader}
          onSimplify={handleSimplify}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: PDF Viewer */}
          <div className="lg:col-span-1">
            <PDFViewer pdfUrl={pdfUrl} />
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
              assessments={assessments}
              onEdit={handleEditAssessment}
              onDelete={handleDeleteAssessment}
              onAddNew={handleAddNewAssessment}
            />

            {/* Recurring Events */}
            <RecurringEventsList
              events={recurringEvents}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onAddNew={handleAddNewEvent}
            />
          </div>
        </div>
      </div>
      
      {/* Edit Modals */}
      <EditAssessmentModal
        assessment={editAssessmentModal.assessment}
        isOpen={editAssessmentModal.isOpen}
        onClose={() => setEditAssessmentModal({ isOpen: false, assessment: null })}
        onSave={handleSaveAssessment}
      />
      
      <EditEventModal
        event={editEventModal.event}
        isOpen={editEventModal.isOpen}
        onClose={() => setEditEventModal({ isOpen: false, event: null })}
        onSave={handleSaveEvent}
      />
      
      {/* Add New Modals */}
      <AddAssessmentModal
        isOpen={addAssessmentModalOpen}
        onClose={() => setAddAssessmentModalOpen(false)}
        onAdd={handleAddAssessment}
      />
      
      <AddEventModal
        isOpen={addEventModalOpen}
        onClose={() => setAddEventModalOpen(false)}
        onAdd={handleAddEvent}
      />
    </div>
  );
}
