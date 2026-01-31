import { ExtractedSpan } from './extracted-span';

/**
 * Assessment/deliverable item with due date
 * Covers assignments, projects, exams, presentations, etc.
 */
export interface Assessment {
  /** Unique identifier for the assessment */
  id?: string;

  /** Assessment title/name */
  title: string;
  title_extracted?: ExtractedSpan[];

  /** Assessment type - flexible to support various terminologies
   * Examples: "Assignment", "Project", "Exam", "Midterm", "Final",
   * "Quiz", "Presentation", "Essay", "Lab Report", "Problem Set",
   * "Deliverable", "Milestone", "Portfolio", etc.
   */
  type: string;
  type_extracted?: ExtractedSpan[];

  /** Due date in ISO 8601 format (YYYY-MM-DD) or (YYYY-MM-DDTHH:mm:ss) */
  due_date?: string;
  due_date_extracted?: ExtractedSpan[];

  /** Due time if specified (e.g., "23:59", "11:59 PM") */
  due_time?: string;
  due_time_extracted?: ExtractedSpan[];

  /** Weight/percentage of final grade (0-100) */
  weight?: number;
  weight_extracted?: ExtractedSpan[];

  /** Description or additional details */
  description?: string;
  description_extracted?: ExtractedSpan[];

  /** Topics or learning outcomes covered */
  topics?: string[];
  topics_extracted?: ExtractedSpan[];

  /** Submission method (e.g., "Online", "In-person", "Brightspace", "Canvas") */
  submission_method?: string;
  submission_method_extracted?: ExtractedSpan[];

  /** Whether this is a group assignment */
  is_group_work?: boolean;

  /** Maximum group size if applicable */
  group_size?: number;
}

/**
 * Grading scheme/rubric information
 */
export interface GradingScheme {
  /** All assessments for the course */
  assessments: Assessment[];

  /** Total weight (should sum to 100) */
  total_weight?: number;

  /** Grading scale (e.g., letter grades, percentages) */
  grading_scale?: {
    letter: string;
    min_percentage: number;
    max_percentage?: number;
  }[];

  /** Late policy description */
  late_policy?: string;
  late_policy_extracted?: ExtractedSpan[];

  /** Other grading notes or policies */
  notes?: string;
  notes_extracted?: ExtractedSpan[];
}
