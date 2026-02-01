import google.generativeai as genai
from typing import Optional, Dict, Any
import json
import os
from config import settings


class GeminiService:
    """Service for interacting with Gemini API for syllabus extraction"""
    
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model_id = settings.gemini_model_id
        
    async def upload_file(self, file_path: str, display_name: Optional[str] = None) -> Any:
        """
        Upload a file to Gemini File API
        
        Args:
            file_path: Path to the file to upload
            display_name: Optional display name for the file
            
        Returns:
            Uploaded file object
        """
        file = genai.upload_file(
            path=file_path,
            display_name=display_name or os.path.basename(file_path)
        )
        return file
    
    async def extract_syllabus_info(self, file: Any) -> Dict[str, Any]:
        """
        Extract syllabus information from an uploaded PDF using Gemini
        
        Args:
            file: Gemini uploaded file object
            
        Returns:
            Dictionary containing extracted syllabus information
        """
        model = genai.GenerativeModel(model_name=self.model_id)
        
        prompt = self._build_extraction_prompt()
        
        # Generate content using the file
        response = model.generate_content([file, prompt])
        
        # Parse the response
        extracted_data = self._parse_response(response.text)
        
        return extracted_data
    
    # def _build_extraction_prompt(self) -> str:
    #     """Build the comprehensive extraction prompt for Gemini"""
#         return """
# You are an expert at extracting structured information from academic syllabus documents.

# Extract ALL of the following information from this syllabus PDF and return it as a valid JSON object that matches this TypeScript schema:

# REQUIRED OUTPUT FORMAT:
# {
#   "language": "en",
#   "institution": {
#     "name": "string",
#     "city": "string",
#     "country": "string",
#     "url": "string (optional)",
#     "description": "string (optional)",
#     "image_url": "string (optional)"
#   },
#   "date": {
#     "term": "string (e.g., Fall, Winter, Spring, Summer)",
#     "year": number
#   },
#   "urls": ["string"],
#   "extracted_sections": {
#     "title": [{"text": "string", "mean_proba": number, "ci1": number, "ci2": number, "ti1": number, "ti2": number}],
#     "code": [{"text": "string", "mean_proba": number, "ci1": number, "ci2": number, "ti1": number, "ti2": number}],
#     "section": [...],
#     "instructor": [...],
#     "instructor_phone": [...],
#     "class_days": [...],
#     "class_time": [...],
#     "class_location": [...],
#     "office_hours_days": [...],
#     "office_hours_times": [...],
#     "office_location": [...],
#     "credits": [...],
#     "description": [...],
#     "learning_outcomes": [...],
#     "required_reading": [...],
#     "grading_rubric": [...],
#     "assessment_strategy": [...],
#     "topic_outline": [...],
#     "assignment_schedule": [...],
#     "teaching_assistants": [
#       {
#         "name": [{"text": "string", "mean_proba": number, "ci1": number, "ci2": number, "ti1": number, "ti2": number}],
#         "email": [...],
#         "phone": [...],
#         "office_hours": {
#           "days": [...],
#           "times": [...],
#           "location": [...]
#         }
#       }
#     ]
#   },
#   "class_schedule": {
#     "timezone": "string (e.g., America/Toronto)",
#     "events": [
#       {
#         "type": "string (e.g., Lecture, Lab, Tutorial, DGD, Seminar, Discussion Group, etc.)",
#         "type_extracted": [...],
#         "days": [0-6 for Sunday-Saturday],
#         "time": {
#           "start": "HH:MM in 24-hour format",
#           "end": "HH:MM in 24-hour format",
#           "extracted": [...]
#         },
#         "location": "string",
#         "location_extracted": [...],
#         "instructor": "string",
#         "instructor_extracted": [...],
#         "start_date": "YYYY-MM-DD (optional)",
#         "end_date": "YYYY-MM-DD (optional)",
#         "notes": "string (optional)"
#       }
#     ]
#   },
#   "grading_scheme": {
#     "assessments": [
#       {
#         "id": "string (optional)",
#         "title": "string",
#         "title_extracted": [...],
#         "type": "string (e.g., Assignment, Project, Exam, Midterm, Final, Quiz, Presentation, Essay, Lab Report, etc.)",
#         "type_extracted": [...],
#         "due_date": "YYYY-MM-DD",
#         "due_date_extracted": [...],
#         "due_time": "HH:MM (optional)",
#         "due_time_extracted": [...],
#         "weight": number (0-100),
#         "weight_extracted": [...],
#         "description": "string (optional)",
#         "description_extracted": [...],
#         "topics": ["string"],
#         "topics_extracted": [...],
#         "submission_method": "string (optional)",
#         "is_group_work": boolean,
#         "group_size": number (optional)
#       }
#     ],
#     "total_weight": number,
#     "grading_scale": [
#       {"letter": "string", "min_percentage": number, "max_percentage": number}
#     ],
#     "late_policy": "string",
#     "late_policy_extracted": [...],
#     "notes": "string (optional)"
#   },
#   "citations": []
# }

# IMPORTANT EXTRACTION RULES:
# 1. For ExtractedSpan objects: estimate confidence scores (mean_proba 0-1), character positions (ci1, ci2), and token positions (ti1, ti2)
# 2. Convert day names to numbers: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
# 3. Convert all times to 24-hour format (e.g., "2:30 PM" → "14:30")
# 4. Extract ALL recurring events (lectures, labs, tutorials, DGDs, seminars, discussion groups, recitations, etc.) - be flexible with terminology
# 5. Extract ALL assessments with due dates and weights
# 6. If dates are relative (e.g., "Week 3"), try to calculate absolute dates based on term start
# 7. Preserve original text in "text" fields and extracted data in separate fields
# 8. If information is missing, omit the field rather than guessing

# Return ONLY the JSON object, no additional text or markdown formatting.
# """
    def _build_extraction_prompt(self) -> str:
      return """
You are an expert at extracting structured information from academic syllabus documents.

You MUST return EXACTLY THREE JSON OBJECTS inside a JSON ARRAY.
Do NOT include markdown, comments, or explanations.

========================
OVERALL RESPONSE FORMAT
========================

[
  ORIGINAL_EXTRACTION_OBJECT,
  ASSESSMENT_CALENDAR_EVENTS_OBJECT,
  RECURRING_CALENDAR_EVENTS_OBJECT
]

========================
OBJECT 1: ORIGINAL EXTRACTION OBJECT
========================

Return the full syllabus extraction using the EXACT schema below (UNCHANGED):

{
  "language": "en",
  "institution": {
    "name": "string",
    "city": "string",
    "country": "string",
    "url": "string (optional)",
    "description": "string (optional)",
    "image_url": "string (optional)"
  },
  "date": {
    "term": "string (e.g., Fall, Winter, Spring, Summer)",
    "year": number
  },
  "urls": ["string"],
  "extracted_sections": { ... },
  "class_schedule": { ... },
  "grading_scheme": { ... },
  "citations": []
}

========================
OBJECT 2: ASSESSMENT CALENDAR EVENTS
========================

THIS OBJECT MUST INCLUDE **ALL GRADING COMPONENTS**.
A grading component is ANY item that:
- contributes to the final grade
- has a percentage, weight, or mark value
- appears in the grading scheme or assessment breakdown
- includes (but is not limited to):
  assignments, projects, quizzes, labs (if graded), presentations,
  reports, participation, midterms, finals, exams, tests

If it affects the grade, it MUST appear here.
DO NOT place graded items in RECURRING CALENDAR EVENTS.

Midterms and finals MUST always appear as assessment calendar events,
even if the exact date is not specified in the syllabus.

IF a grading component exists but NO due date or exam date is provided:

- STILL create an assessment calendar event
- Use the term end date as the start date
- Set start time to 23:59 local time
- Add "(DATE TBA)" to the description
- DO NOT omit the assessment

This object MUST be in Google Calendar API format.

Schema:
{
  "course_name": "string",
  "events": [
    {
      "summary": "string",
      "description": "string",
      "start": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "end": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "reminders": {
        "useDefault": false,
        "overrides": [
          { "method": "email", "minutes": number },
          { "method": "popup", "minutes": number }
        ]
      }
    }
  ]
}


SUMMARY RULES (MANDATORY):
- summary MUST start with "📝 "
- summary MUST end with "(XX%)" where XX is the assessment weight
- Example:
  "📝 Assignment 1 (15%)"
  "📝 Final Exam (30%)"

Additional Rules:
- Include ALL assessments (assignments, projects, quizzes, midterms, finals, labs, presentations).
- Use due date + due time to construct start/end times.
- If due time is missing, assume 23:59 local time.
- End time should be 1 hour after start time.
- Include assessment weight in the description.
- Do NOT include recurrence rules here.

========================
OBJECT 3: RECURRING CALENDAR EVENTS
========================

This object MUST be in Google Calendar API format.

Schema:
{
  "course_name": "string",
  "events": [
    {
      "summary": "string",
      "description": "string",
      "start": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "end": {
        "dateTime": "ISO 8601 datetime",
        "timeZone": "America/Toronto"
      },
      "recurrence": [
        "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=YYYYMMDDT235959Z"
      ],
      "location": "string"
    }
  ]
}

SUMMARY RULES (MANDATORY):
- summary MUST start with "📚 "
- Example:
  "📚 CSI 1234 - Lecture"
  "📚 CSI 1234 - Lab"

Additional Rules:
- Include ALL recurring events (lectures, labs, tutorials, DGDs, seminars, discussion groups).
- Convert weekday names to RRULE BYDAY values (MO, TU, WE, TH, FR).
- Calculate UNTIL date using term end date if available.
- Use class start/end times.
- Do NOT include assessments here.

========================
GLOBAL RULES (VERY IMPORTANT)
========================

1. Output MUST be valid JSON
2. Output MUST be a JSON ARRAY of exactly 3 objects
3. No markdown
4. No explanations
5. No guessing — omit fields if unknown
6. All times must be ISO 8601
7. Use timezone: America/Toronto

Return ONLY the JSON array.
"""


    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the Gemini response into structured data
        
        Args:
            response_text: Raw text response from Gemini
            
        Returns:
            Parsed dictionary
        """
        # Remove markdown code blocks if present
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        elif cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        
        cleaned_text = cleaned_text.strip()
        
        try:
            data = json.loads(cleaned_text)
            return data
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}\nResponse: {cleaned_text[:500]}")


# Global service instance
gemini_service = GeminiService()
