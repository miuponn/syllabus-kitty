import { ExtractedSpan } from './extracted-span';

/**
 * Teaching Assistant model
 * Designed to work even when some info is missing
 */
export interface TeachingAssistant {
  name: ExtractedSpan[];
  email?: ExtractedSpan[];
  phone?: ExtractedSpan[];
  office_hours?: {
    days?: ExtractedSpan[];
    times?: ExtractedSpan[];
    location?: ExtractedSpan[];
  };
}
