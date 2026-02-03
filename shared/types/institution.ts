/* UNUSED */
/* Represents an educational institution */
export interface Institution {
  name: string;
  city: string;
  country: string;
  url?: string;
  description?: string;
  image_url?: string;
}

/* Represents an academic term/semester date */
export interface AcademicDate {
  term: string;
  year: number;
}
