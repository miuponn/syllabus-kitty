import { Institution, AcademicDate } from './institution';
import { ExtractedSections } from './extracted-sections';
import { Citation } from './citation';
import { ClassSchedule } from './class-schedule';
import { GradingScheme } from './assessment';

/* Top-level document model representing a complete syllabus extraction */
export interface SyllabusDocument {
  /* Language code (e.g., 'en', 'fr') */
  language: string;

  /* Educational institution information */
  institution: Institution;

  /* Academic term and year */
  date: AcademicDate;

  /* URLs associated with the syllabus */
  urls: string[];

  /* All extracted sections from NLP processing */
  extracted_sections: ExtractedSections;

  /* Citations/references found in the syllabus */
  citations: Citation[];

  /* Recurring class events (lectures, labs, tutorials, etc.) */
  class_schedule?: ClassSchedule;

  /* Assessments and grading scheme (assignments, exams, projects, etc.) */
  grading_scheme?: GradingScheme;
}
