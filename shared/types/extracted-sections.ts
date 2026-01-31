import { ExtractedSpan } from './extracted-span';
import { TeachingAssistant } from './teaching-assistant';

<<<<<<< HEAD
/* NLP output containing all extracted sections from the syllabus */

=======
/**
 * Core NLP output containing all extracted sections from the syllabus
 */
>>>>>>> 06a67a2b3582b32eff048fb0af505fcb53774af8
export interface ExtractedSections {
  // Basic course information
  title?: ExtractedSpan[];
  code?: ExtractedSpan[];
  section?: ExtractedSpan[];
  date?: ExtractedSpan[];

  // Class schedule information
  class_days?: ExtractedSpan[];
  class_time?: ExtractedSpan[];
  class_location?: ExtractedSpan[];

  // Instructor information
  instructor?: ExtractedSpan[];
  instructor_phone?: ExtractedSpan[];

  // Office hours
  office_hours_days?: ExtractedSpan[];
  office_hours_times?: ExtractedSpan[];
  office_location?: ExtractedSpan[];

  // Course details
  credits?: ExtractedSpan[];
  description?: ExtractedSpan[];
  learning_outcomes?: ExtractedSpan[];

  // Course content and assessment
  required_reading?: ExtractedSpan[];
  grading_rubric?: ExtractedSpan[];
  assessment_strategy?: ExtractedSpan[];
  topic_outline?: ExtractedSpan[];
  assignment_schedule?: ExtractedSpan[];

  // Institution
  school_name?: ExtractedSpan[];

  // Teaching assistants (supports multiple TAs with partial info)
  teaching_assistants?: TeachingAssistant[];
}
