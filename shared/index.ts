/* Syllabus Kitty - UNUSED Shared Type Definitions - for syllabus document extraction and processing. */

// Core primitives
export type { ExtractedSpan } from './types/extracted-span';

// Institution and date models
export type { Institution, AcademicDate } from './types/institution';

// Teaching assistant model
export type { TeachingAssistant } from './types/teaching-assistant';

// Extracted sections (core NLP output)
export type { ExtractedSections } from './types/extracted-sections';

// Citation models
export type {
  Citation,
  ParsedCitation,
  CatalogKey,
  CatalogRecord,
} from './types/citation';

// Class schedule and recurring events
export type {
  RecurringEvent,
  ClassSchedule,
  DayOfWeek,
  TimeSlot,
} from './types/class-schedule';

// Assessments and grading
export type { Assessment, GradingScheme } from './types/assessment';

// Top-level syllabus document
export type { SyllabusDocument } from './types/syllabus';
