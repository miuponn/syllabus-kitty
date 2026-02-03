/* UNUSED */
import { ExtractedSpan } from './extracted-span';

/* Day of week enum for recurring events */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/* Time representation */
export interface TimeSlot {
  /* Start time in 24-hour format (e.g., "09:00", "14:30") */
  start: string;
  /* End time in 24-hour format */
  end: string;
  /* Optional extracted span if parsed from document */
  extracted?: ExtractedSpan[];
}

/* Recurring class event (lecture, lab, tutorial, DGD, etc.) */
export interface RecurringEvent {
  /* Event type - flexible string to support various terminologies
   * Examples: "Lecture", "Lab", "Tutorial", "DGD", "Seminar", "Workshop",
   * "Discussion Group", "Recitation", "Practicum", etc.
   */
  type: string;
  
  /* Raw extracted type from document for context */
  type_extracted?: ExtractedSpan[];

  /* Days of week this event occurs */
  days: DayOfWeek[];
  
  /* Time slot for the event */
  time: TimeSlot;

  /* Location/room information */
  location?: string;
  location_extracted?: ExtractedSpan[];

  /* Instructor or TA name for this specific event */
  instructor?: string;
  instructor_extracted?: ExtractedSpan[];

  /* Start date for recurrence (if specified) */
  start_date?: string; // ISO 8601 format: YYYY-MM-DD
  
  /* End date for recurrence (if specified) */
  end_date?: string; // ISO 8601 format: YYYY-MM-DD

  /* Additional notes or context */
  notes?: string;
  notes_extracted?: ExtractedSpan[];
}

/* Complete class schedule containing all recurring events */
export interface ClassSchedule {
  /* All recurring events for the course */
  events: RecurringEvent[];
  
  /* Default timezone for all events (e.g., "America/Toronto", "America/New_York") */
  timezone?: string;
}
