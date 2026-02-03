/**
 * UNUSED
 * Generic extracted span from NLP
 * Represents a piece of text extracted from a document with confidence and position metadata
 */
export interface ExtractedSpan {
  /** The extracted text content */
  text: string;
  /** Mean probability / confidence score (0-1) */
  mean_proba: number;
  /** Character index start position */
  ci1: number;
  /** Character index end position */
  ci2: number;
  /** Token index start position */
  ti1: number;
  /** Token index end position */
  ti2: number;
}
