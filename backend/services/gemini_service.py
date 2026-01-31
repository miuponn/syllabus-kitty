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
    
    def _build_extraction_prompt(self) -> str:
        """Build the comprehensive extraction prompt for Gemini"""
        return """
You are an expert at extracting structured information from academic syllabus documents.

Extract ALL of the following information from this syllabus PDF and return it as a valid JSON object that matches this TypeScript schema:

REQUIRED OUTPUT FORMAT:
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
  "extracted_sections": {
    "title": [{"text": "string", "mean_proba": number, "ci1": number, "ci2": number, "ti1": number, "ti2": number}],
    "code": [{"text": "string", "mean_proba": number, "ci1": number, "ci2": number, "ti1": number, "ti2": number}],
    "section": [...],
    "instructor": [...],
    "instructor_phone": [...],
    "class_days": [...],
    "class_time": [...],
    "class_location": [...],
    "office_hours_days": [...],
    "office_hours_times": [...],
    "office_location": [...],
    "credits": [...],
    "description": [...],
    "learning_outcomes": [...],
    "required_reading": [...],
    "grading_rubric": [...],
    "assessment_strategy": [...],
    "topic_outline": [...],
    "assignment_schedule": [...],
    "teaching_assistants": [
      {
        "name": [{"text": "string", "mean_proba": number, "ci1": number, "ci2": number, "ti1": number, "ti2": number}],
        "email": [...],
        "phone": [...],
        "office_hours": {
          "days": [...],
          "times": [...],
          "location": [...]
        }
      }
    ]
  },
  "class_schedule": {
    "timezone": "string (e.g., America/Toronto)",
    "events": [
      {
        "type": "string (e.g., Lecture, Lab, Tutorial, DGD, Seminar, Discussion Group, etc.)",
        "type_extracted": [...],
        "days": [0-6 for Sunday-Saturday],
        "time": {
          "start": "HH:MM in 24-hour format",
          "end": "HH:MM in 24-hour format",
          "extracted": [...]
        },
        "location": "string",
        "location_extracted": [...],
        "instructor": "string",
        "instructor_extracted": [...],
        "start_date": "YYYY-MM-DD (optional)",
        "end_date": "YYYY-MM-DD (optional)",
        "notes": "string (optional)"
      }
    ]
  },
  "grading_scheme": {
    "assessments": [
      {
        "id": "string (optional)",
        "title": "string",
        "title_extracted": [...],
        "type": "string (e.g., Assignment, Project, Exam, Midterm, Final, Quiz, Presentation, Essay, Lab Report, etc.)",
        "type_extracted": [...],
        "due_date": "YYYY-MM-DD",
        "due_date_extracted": [...],
        "due_time": "HH:MM (optional)",
        "due_time_extracted": [...],
        "weight": number (0-100),
        "weight_extracted": [...],
        "description": "string (optional)",
        "description_extracted": [...],
        "topics": ["string"],
        "topics_extracted": [...],
        "submission_method": "string (optional)",
        "is_group_work": boolean,
        "group_size": number (optional)
      }
    ],
    "total_weight": number,
    "grading_scale": [
      {"letter": "string", "min_percentage": number, "max_percentage": number}
    ],
    "late_policy": "string",
    "late_policy_extracted": [...],
    "notes": "string (optional)"
  },
  "citations": []
}

IMPORTANT EXTRACTION RULES:
1. For ExtractedSpan objects: estimate confidence scores (mean_proba 0-1), character positions (ci1, ci2), and token positions (ti1, ti2)
2. Convert day names to numbers: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
3. Convert all times to 24-hour format (e.g., "2:30 PM" → "14:30")
4. Extract ALL recurring events (lectures, labs, tutorials, DGDs, seminars, discussion groups, recitations, etc.) - be flexible with terminology
5. Extract ALL assessments with due dates and weights
6. If dates are relative (e.g., "Week 3"), try to calculate absolute dates based on term start
7. Preserve original text in "text" fields and extracted data in separate fields
8. If information is missing, omit the field rather than guessing

Return ONLY the JSON object, no additional text or markdown formatting.
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
