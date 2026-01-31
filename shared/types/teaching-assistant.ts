import { ExtractedSpan } from './extracted-span';

<<<<<<< HEAD
/* Teaching Assistant model - Designed to work even when some info is missing */
=======
/**
 * Teaching Assistant model
 * Designed to work even when some info is missing
 */
>>>>>>> 06a67a2b3582b32eff048fb0af505fcb53774af8
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
