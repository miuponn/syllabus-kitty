'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { createClient } from '@/app/lib/supabaseClient';
import PDFViewer from '../../components/PDFViewer';
import SyllabusHeader from '../../components/SyllabusHeader';
import SyllabusLoading from '../../components/SyllabusLoading';
import AssessmentsList from '../../components/AssessmentsList';
import RecurringEventsList from '../../components/RecurringEventsList';
import EditAssessmentModal from '../../components/EditAssessmentModal';
import EditEventModal from '../../components/EditEventModal';
import AddAssessmentModal from '../../components/AddAssessmentModal';
import AddEventModal from '../../components/AddEventModal';
import CalendarSuccessModal from '../../components/CalendarSuccessModal';

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
  
  // Calendar success modal state
  const [calendarSuccessModal, setCalendarSuccessModal] = useState<{
    isOpen: boolean;
    eventsAdded: number;
    courseName: string;
  }>({ isOpen: false, eventsAdded: 0, courseName: '' });
  
  // Simplify PDF state
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifiedPdfUrl, setSimplifiedPdfUrl] = useState<string | null>(null);
  const [simplifiedPdfBlob, setSimplifiedPdfBlob] = useState<Blob | null>(null);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);
  const [hasSimplified, setHasSimplified] = useState(false); // track if simplified version exists
  
  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  
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
      // Show success modal instead of alert
      const totalEvents = assessments.length + recurringEvents.length;
      setCalendarSuccessModal({
        isOpen: true,
        eventsAdded: result.events_added || totalEvents,
        courseName: calendarJson?.course_name || 'your course',
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert(error instanceof Error ? error.message : 'Failed to add events to calendar');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const handleTranslate = async (languageCode: string) => {
    if (!hasSimplified) {
      alert('Please click "Simplify" first to generate a simplified syllabus before translating.');
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const { supabaseToken } = await getTokens();
      
      const response = await fetch('http://localhost:8000/api/simplify/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(supabaseToken ? { 'Authorization': `Bearer ${supabaseToken}` } : {}),
        },
        body: JSON.stringify({
          syllabus_id: syllabusId,
          target_language: languageCode,
          generate_pdf: true,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to translate syllabus');
      }
      
      // Get the PDF blob and trigger download
      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `simplified_syllabus_${languageCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error('Error translating syllabus:', error);
      alert(error instanceof Error ? error.message : 'Failed to translate syllabus');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleScreenReader = () => {
    alert('Screen reader feature coming soon!');
  };

  const handleSimplify = async () => {
    // If already simplified, toggle back to original
    if (isSimplified) {
      setIsSimplified(false);
      setSimplifyError(null);
      return;
    }
    
    // If we already have a simplified URL cached, just switch to it
    if (simplifiedPdfUrl) {
      setIsSimplified(true);
      setSimplifyError(null);
      return;
    }
    
    setIsSimplifying(true);
    setSimplifyError(null);
    
    try {
      const { supabaseToken } = await getTokens();
      
      // Build syllabus data from what we have
      const syllabusData = {
        courseInfo: {
          courseName: calendarJson?.course_name || 'Course Syllabus',
        },
        assessments: assessments.map(a => ({
          title: a.title,
          type: a.type,
          weight: a.weight,
          dueDate: a.due_date,
          description: a.description,
        })),
        recurringEvents: recurringEvents.map(e => ({
          title: e.title,
          type: e.type,
          dayOfWeek: e.day_of_week,
          startTime: e.start_time,
          endTime: e.end_time,
          location: e.location,
        })),
        calendarEvents: calendarJson,
      };
      
      const response = await fetch('http://localhost:8000/api/simplify/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(supabaseToken ? { 'Authorization': `Bearer ${supabaseToken}` } : {}),
        },
        body: JSON.stringify({
          syllabus_data: syllabusData,
          target_language: 'en',
          original_filename: calendarJson?.course_name,
          syllabus_id: syllabusId, // Store simplified markdown in DB for later translation
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate simplified PDF');
      }
      
      // Get the PDF blob and create a local URL
      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      setSimplifiedPdfBlob(pdfBlob);
      setSimplifiedPdfUrl(blobUrl);
      setIsSimplified(true);
      setHasSimplified(true); // Mark that simplified version exists for translation
      
    } catch (error) {
      console.error('Error simplifying syllabus:', error);
      setSimplifyError(error instanceof Error ? error.message : 'Failed to simplify');
      // Auto-clear error after 5 seconds
      setTimeout(() => setSimplifyError(null), 5000);
    } finally {
      setIsSimplifying(false);
    }
  };
  
  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (simplifiedPdfUrl) {
        URL.revokeObjectURL(simplifiedPdfUrl);
      }
    };
  }, [simplifiedPdfUrl]);

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
    return <SyllabusLoading />;
  }

  return (
    <div className="min-h-screen relative pt-16 sm:pt-20" style={{ background: 'var(--gradient-page)', backgroundAttachment: 'fixed' }}>
      {/* Floating decorative elements - background only */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated blurs - varied colors */}
        <img 
          src="/assets/images/blur.svg" 
          alt="" 
          className="absolute top-20 left-10 w-64 h-64 opacity-50 animate-blob"
          style={{ filter: 'hue-rotate(0deg)' }}
        />
        <img 
          src="/assets/images/blur2.svg" 
          alt="" 
          className="absolute top-40 right-20 w-80 h-80 opacity-40 animate-blob" 
          style={{ animationDelay: '2s', filter: 'hue-rotate(30deg)' }}
        />
        <img 
          src="/assets/images/blur.svg" 
          alt="" 
          className="absolute top-[30%] left-1/3 w-72 h-72 opacity-45 animate-blob" 
          style={{ animationDelay: '4s', filter: 'hue-rotate(-20deg)' }}
        />
        <img 
          src="/assets/images/blur2.svg" 
          alt="" 
          className="absolute top-[50%] right-1/4 w-96 h-96 opacity-35 animate-blob" 
          style={{ animationDelay: '1s', filter: 'hue-rotate(60deg)' }}
        />
        <img 
          src="/assets/images/blur.svg" 
          alt="" 
          className="absolute top-[70%] left-20 w-80 h-80 opacity-40 animate-blob" 
          style={{ animationDelay: '3s', filter: 'hue-rotate(45deg)' }}
        />
        <img 
          src="/assets/images/blur2.svg" 
          alt="" 
          className="absolute top-[90%] right-10 w-64 h-64 opacity-50 animate-blob" 
          style={{ animationDelay: '5s', filter: 'hue-rotate(-30deg)' }}
        />
        <img 
          src="/assets/images/blur.svg" 
          alt="" 
          className="absolute top-[110%] left-1/2 w-72 h-72 opacity-45 animate-blob" 
          style={{ animationDelay: '2.5s', filter: 'hue-rotate(90deg)' }}
        />
        <img 
          src="/assets/images/blur2.svg" 
          alt="" 
          className="absolute top-[130%] right-1/3 w-88 h-88 opacity-35 animate-blob" 
          style={{ animationDelay: '4.5s', filter: 'hue-rotate(15deg)' }}
        />

        {/* Flickering twinkles and circles with pink glow */}
        <img 
          src="/assets/images/twinkle-rough.svg" 
          alt="" 
          className="absolute top-32 right-16 w-10 h-10 animate-flicker opacity-70"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '0s' 
          }}
        />
        <img 
          src="/assets/images/circle-rough.svg" 
          alt="" 
          className="absolute top-60 left-24 w-8 h-8 animate-flicker opacity-60"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '1.2s' 
          }}
        />
        <img 
          src="/assets/images/twinkle-rough.svg" 
          alt="" 
          className="absolute top-[40%] right-32 w-12 h-12 animate-flicker opacity-65"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '0.8s' 
          }}
        />
        <img 
          src="/assets/images/circle-rough.svg" 
          alt="" 
          className="absolute top-[55%] left-16 w-9 h-9 animate-flicker opacity-55"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '2s' 
          }}
        />
        <img 
          src="/assets/images/twinkle-rough.svg" 
          alt="" 
          className="absolute top-[75%] right-20 w-11 h-11 animate-flicker opacity-60"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '1.5s' 
          }}
        />
        <img 
          src="/assets/images/circle-rough.svg" 
          alt="" 
          className="absolute top-[95%] left-1/4 w-10 h-10 animate-flicker opacity-50"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '2.5s' 
          }}
        />
        <img 
          src="/assets/images/twinkle-rough.svg" 
          alt="" 
          className="absolute top-[115%] right-1/4 w-8 h-8 animate-flicker opacity-65"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '0.5s' 
          }}
        />
        <img 
          src="/assets/images/circle-rough.svg" 
          alt="" 
          className="absolute top-[135%] left-32 w-12 h-12 animate-flicker opacity-55"
          style={{ 
            filter: 'drop-shadow(0 0 12px #FFC1D0) drop-shadow(0 0 24px #FFC1D0)',
            animationDelay: '3s' 
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Menu Bar */}
          <SyllabusHeader
            onTranslate={handleTranslate}
            onScreenReader={handleScreenReader}
            onSimplify={handleSimplify}
            isTranslating={isTranslating}
            isSimplifying={isSimplifying}
            hasSimplified={hasSimplified}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: PDF Viewer */}
            <div className="lg:col-span-1">
              <PDFViewer 
                pdfUrl={pdfUrl} 
                jsonData={calendarJson} 
                filename={calendarJson?.course_name}
                simplifiedPdfUrl={simplifiedPdfUrl}
                isSimplified={isSimplified}
                simplifiedPdfBlob={simplifiedPdfBlob}
              />
            </div>

            {/* Right: Schedule & Assessments */}
            <div className="lg:col-span-1 space-y-6">
              {/* Add to Calendar Button */}
              <button
                onClick={handleAddAllToCalendar}
                disabled={isAddingToCalendar}
                className="w-full py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl lg:text-2xl text-white rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 hover:shadow-xl active:scale-98 active:brightness-110"
                style={{ 
                  background: 'var(--gradient-peach)',
                  backgroundSize: '200% 200%',
                  backgroundPosition: '0% 50%',
                  fontFamily: 'Chewie, display',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  if (!isAddingToCalendar) {
                    e.currentTarget.style.animation = 'gradient-shift 2s ease infinite';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = 'none';
                }}
              >
                {isAddingToCalendar ? (
                  <>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding to Calendar...
                  </>
                ) : (
                  <>
                    <img 
                      src="/assets/images/calendar2.png" 
                      alt="" 
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 object-contain"
                    />
                    Add All to Google Calendar
                    <img 
                      src="/assets/images/sparkles.svg" 
                      alt="" 
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
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

      {/* Calendar Success Modal */}
      <CalendarSuccessModal
        isOpen={calendarSuccessModal.isOpen}
        onClose={() => setCalendarSuccessModal({ isOpen: false, eventsAdded: 0, courseName: '' })}
        eventsAdded={calendarSuccessModal.eventsAdded}
        courseName={calendarSuccessModal.courseName}
      />
    </div>
  );
}
