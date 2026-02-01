"""
Simplified Syllabus Service

Creates an accessible, plain-language version of a syllabus using a standardized template.
Designed for:
- ESL students
- Screen reader users
- Students with ADHD, dyslexia, or executive-function challenges
- Anyone who wants a predictable, scannable format
"""

import google.generativeai as genai
from config import settings
import json
from typing import Optional, Dict, Any, List
from io import BytesIO

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)

# Supported languages for translation
SUPPORTED_LANGUAGES = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "zh": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "ar": "Arabic",
    "hi": "Hindi",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "de": "German",
    "it": "Italian",
    "vi": "Vietnamese",
    "tl": "Tagalog",
    "fa": "Persian (Farsi)",
    "uk": "Ukrainian",
    "pl": "Polish",
    "tr": "Turkish",
}

SIMPLIFIED_TEMPLATE_PROMPT = """
You are an accessibility-focused document formatter AND information extractor. Your job is to take syllabus information and create a clear, predictable, plain-language document that works for:
- ESL (English as Second Language) students
- Screen reader users
- Students with ADHD, dyslexia, or executive-function challenges

===== EXTRACTION RULES (CRITICAL) =====

TERMINOLOGY FLEXIBILITY - Recognize these synonyms:
- INSTRUCTOR: "professor", "instructor", "teacher", "lecturer", "course coordinator", "faculty", "prof", "Dr."
- TA: "teaching assistant", "TA", "graduate assistant", "GA", "lab assistant", "tutorial assistant", "marker", "grader"
- LECTURE: "lecture", "class", "meeting", "session", "lec"
- LAB: "lab", "laboratory", "practical", "hands-on session"
- TUTORIAL: "tutorial", "DGD", "discussion group", "discussion", "recitation", "seminar", "problem session", "review session"
- OFFICE HOURS: "office hours", "consultation hours", "drop-in hours", "availability", "student hours", "help hours"
- ASSESSMENT: "assignment", "homework", "project", "exam", "test", "quiz", "midterm", "final", "essay", "paper", "lab report", "presentation"

DAY NAME CONVERSION - Always convert to standard format:
- Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6
- Accept variations: "Mon"/"M" = Monday, "Tue"/"Tu"/"T" = Tuesday, "Wed"/"W" = Wednesday, "Thu"/"Th"/"R" = Thursday, "Fri"/"F" = Friday, "Sat"/"S" = Saturday, "Sun"/"U" = Sunday
- "MWF" = Monday, Wednesday, Friday; "TR" or "TTh" = Tuesday, Thursday

TIME CONVERSION - Always convert to 24-hour format:
- "2:30 PM" → "14:30"
- "9 AM" → "09:00"
- "noon" → "12:00"
- "midnight" → "00:00"
- Time ranges: "2:30-4:00 PM" → "14:30-16:00"

EXTRACT ALL RECURRING EVENTS:
- Look for ANY regularly scheduled class activities (lectures, labs, tutorials, DGDs, seminars, discussion groups, recitations, workshops, etc.)
- Include day(s), time (24-hour format), location/room, and any special notes
- Be flexible: some syllabi use tables, some use prose, some use bullet points

EXTRACT ALL ASSESSMENTS:
- Find EVERY graded item with its weight (percentage) and due date
- Include: assignments, quizzes, exams (midterm, final), projects, participation, attendance, labs, papers, presentations
- Weights should sum to ~100% (note if they don't)
- If dates are relative (e.g., "Week 3", "end of term"), try to calculate absolute dates using term start date if provided

DATA INTEGRITY:
- Preserve original text when quoting specific requirements
- If information is missing, omit the field rather than guessing
- If information is ambiguous, note it in "Missing or Unclear Information"
- Never invent dates, weights, or contact information

===== FORMATTING RULES =====
1. Use simple, direct language (avoid jargon)
2. Keep sentences short (under 20 words when possible)
3. Use consistent formatting throughout
4. Mark missing information clearly with "[Not specified in syllabus]"
5. Never invent or assume information that isn't provided
6. Use bullet points and numbered lists for clarity
7. Include the "Missing or Unclear Information" section at the end

Given the following syllabus data, fill out this template. Only include sections where information is available. For the grades table, format it as a simple list if a table isn't possible.

===== TEMPLATE START =====

# SIMPLIFIED SYLLABUS

## 1) Course Identity

**Course:** {course title}
**Code:** {course code}
**Term:** {term and year}
**Institution:** {institution name}
**Location / Timezone:** {city, timezone}
**Syllabus file:** {original filename if available}

---

## 2) People

### Instructor / Professor / Course Coordinator
Look for: professor, instructor, teacher, lecturer, course coordinator, faculty member

- **Name:** {instructor name with title if given, e.g., "Dr. Jane Smith" or "Prof. John Doe"}
- **Email:** {instructor email}
- **Office:** {office location/room number}
- **Office hours:** {days (with day numbers) and times (24-hour format)}
- **How to get help:** {preferred contact method, response time expectations}

### Teaching Assistant(s) / Lab Assistants / Markers
Look for: TA, teaching assistant, graduate assistant, lab assistant, tutorial assistant, marker, grader

{For each TA/assistant:}
- **Name:** {TA name}
- **Role:** {TA, lab assistant, marker, etc. if specified}
- **Email:** {TA email}
- **Office hours:** {days (with day numbers) and times (24-hour format)}
- **Sections/Labs:** {which sections they cover, if specified}

---

## 3) Weekly Schedule

For each recurring event, provide:
- Day number(s): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- Times in 24-hour format (e.g., 14:30 not 2:30 PM)

### Lecture
- **Day(s):** {day numbers, e.g., "1, 3" for Monday and Wednesday}
- **Day names:** {day names for readability}
- **Time:** {start time - end time in 24-hour format, e.g., "10:00-11:30"}
- **Location:** {room/building}

### Lab / Laboratory / Practical
- **Day(s):** {day numbers}
- **Day names:** {day names}
- **Time:** {start time - end time in 24-hour format}
- **Location:** {room/building}
- **Notes:** {any special instructions like "bring laptop"}

### Tutorial / DGD / Discussion / Recitation
- **Day(s):** {day numbers}
- **Day names:** {day names}
- **Time:** {start time - end time in 24-hour format}
- **Location:** {room/building}

### Other Recurring Events
{Include any seminars, workshops, review sessions, etc.}

---

## 4) Important Dates & Grades

### Term Dates
- **Term start:** {first day of classes}
- **Term end:** {last day of classes}
- **Reading week / Break:** {dates if applicable}

### All Assessments (must total ~100%)

Extract EVERY graded item. Format each as:
- **{Assessment title}** — {weight}% — Due: {date in YYYY-MM-DD format} at {time in 24-hour format}
  - Type: {assignment/quiz/exam/project/participation/etc.}
  - Notes: {any special notes, submission method, etc.}

{List ALL assessments here, including:}
- Assignments/Homework
- Quizzes
- Midterm exam(s)
- Final exam
- Projects
- Lab reports
- Participation/Attendance
- Presentations
- Papers/Essays

**Total weight:** {sum of all weights}% (should be ~100%)

### Late Policy
{Explain the late policy in simple terms - penalty per day/hour, grace period, etc.}

---

## 5) Academic Accommodations

### Disability / Accessibility Services
- **Office or program name:** {name of accessibility office}
- **How to request accommodations:** {steps to follow}
- **Deadline to apply:** {if mentioned}

### What students should do if they need help:
- For exam accommodations: {instructions}
- For extensions / special circumstances: {instructions}

---

## 6) Required & Optional Readings

### Required
{For each required reading:}
- **Title:** {book/article title}
- **Author(s):** {author names}
- **Year:** {publication year}
- **Publisher / Journal:** {publisher}
- **Link or ISBN:** {if available}

### Optional / Recommended
{List any optional readings}

---

## 7) Course Policies (Plain Language)

### Attendance
{Explain attendance policy simply}

### Participation
{Explain participation expectations}

### Academic Integrity
{Explain in simple terms - what counts as cheating, what's allowed}

### Communication Rules
{Email response time, preferred contact methods, forum rules}

---

## 8) What to Do First (Action Plan)

Use this checklist to get started:

- [ ] Add all classes to your calendar
- [ ] Add all due dates to your calendar
- [ ] Save instructor & TA emails to your contacts
- [ ] Set reminders (7 days + 2 days before each deadline)
- [ ] Check accommodation deadlines if you need support
- [ ] {Any course-specific first steps like "buy textbook" or "set up software"}

---

## 9) Missing or Unclear Information

The following information was not found in the syllabus:

{List each piece of missing information as a bullet point, e.g.:}
- Instructor email not listed
- Office hours not specified
- Lab schedule missing
- Accommodation process not detailed

===== TEMPLATE END =====

Now, here is the syllabus data to process:

{syllabus_data}

Generate the simplified syllabus document following the template above. 

CRITICAL REMINDERS:
- Convert ALL day names to numbers (Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6)
- Convert ALL times to 24-hour format (e.g., "2:30 PM" → "14:30")
- Extract ALL recurring events (lectures, labs, tutorials, DGDs, seminars, etc.)
- Extract ALL assessments with weights and due dates
- Use flexible terminology recognition (professor=instructor=teacher, TA=teaching assistant=grader, etc.)
- If dates are relative (e.g., "Week 3"), calculate absolute dates if term start is known
- Omit fields with no information rather than guessing
- The "Missing or Unclear Information" section should always exist
- Keep language simple and direct
"""

TRANSLATION_PROMPT = """
You are a professional translator specializing in educational documents. 
Translate the following simplified syllabus document from English to {target_language}.

RULES:
1. Maintain all formatting (headers, bullet points, checkboxes)
2. Keep proper nouns (names, places, course codes) in their original form
3. Translate dates to the target language format if appropriate
4. Use formal but accessible language appropriate for students
5. Preserve the meaning exactly - do not add or remove information
6. Keep "[Not specified in syllabus]" markers but translate them

Document to translate:

{document}

Provide the complete translated document.
"""


def create_simplified_syllabus(
    syllabus_data: Dict[str, Any],
    original_filename: Optional[str] = None
) -> str:
    """
    Generate a simplified, accessible version of a syllabus.
    
    Args:
        syllabus_data: The extracted syllabus data (can be raw JSON or structured data)
        original_filename: The original PDF filename for reference
        
    Returns:
        A markdown-formatted simplified syllabus document
    """
    model = genai.GenerativeModel(settings.gemini_model_id)
    
    # Prepare the data for the prompt
    data_str = json.dumps(syllabus_data, indent=2, default=str)
    
    if original_filename:
        data_str = f"Original filename: {original_filename}\n\n{data_str}"
    
    prompt = SIMPLIFIED_TEMPLATE_PROMPT.replace("{syllabus_data}", data_str)
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,  # Lower temperature for more consistent output
            max_output_tokens=8000,
        )
    )
    
    return response.text


def translate_simplified_syllabus(
    document: str,
    target_language: str
) -> str:
    """
    Translate a simplified syllabus to another language.
    
    Args:
        document: The simplified syllabus markdown document
        target_language: Language code (e.g., 'fr', 'es', 'zh')
        
    Returns:
        The translated document
    """
    if target_language not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {target_language}. Supported: {list(SUPPORTED_LANGUAGES.keys())}")
    
    language_name = SUPPORTED_LANGUAGES[target_language]
    
    model = genai.GenerativeModel(settings.gemini_model_id)
    
    prompt = TRANSLATION_PROMPT.replace("{target_language}", language_name).replace("{document}", document)
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,  # Very low temperature for accurate translation
            max_output_tokens=10000,
        )
    )
    
    return response.text


def create_and_translate_simplified_syllabus(
    syllabus_data: Dict[str, Any],
    target_language: str = "en",
    original_filename: Optional[str] = None
) -> Dict[str, str]:
    """
    Create a simplified syllabus and optionally translate it.
    
    Args:
        syllabus_data: The extracted syllabus data
        target_language: Language code for output (default: 'en' for English)
        original_filename: The original PDF filename
        
    Returns:
        Dict with 'english' (always) and 'translated' (if not English) versions
    """
    # Always create the English version first
    english_version = create_simplified_syllabus(syllabus_data, original_filename)
    
    result = {
        "english": english_version,
        "language": "en",
        "language_name": "English"
    }
    
    # Translate if requested language is not English
    if target_language != "en":
        translated_version = translate_simplified_syllabus(english_version, target_language)
        result["translated"] = translated_version
        result["language"] = target_language
        result["language_name"] = SUPPORTED_LANGUAGES.get(target_language, target_language)
    
    return result


def get_supported_languages() -> Dict[str, str]:
    """Return the dictionary of supported languages."""
    return SUPPORTED_LANGUAGES.copy()


# PDF Generation
PDF_CSS = """
@page {
    size: letter;
    margin: 1in 0.75in;
}

body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000000;
    max-width: 100%;
}

h1 {
    font-size: 20pt;
    font-weight: 700;
    color: #000000;
    margin-top: 0;
    margin-bottom: 16pt;
    padding-bottom: 8pt;
    border-bottom: 2pt solid #000000;
}

h2 {
    font-size: 14pt;
    font-weight: 600;
    color: #000000;
    margin-top: 20pt;
    margin-bottom: 10pt;
    padding: 6pt 10pt;
    border-left: 4pt solid #000000;
    page-break-after: avoid;
}

h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #000000;
    margin-top: 14pt;
    margin-bottom: 8pt;
}

p {
    margin: 8pt 0;
}

ul, ol {
    margin: 8pt 0;
    padding-left: 24pt;
}

li {
    margin: 4pt 0;
}

/* Checkbox styling */
li:has(input[type="checkbox"]) {
    list-style: none;
    margin-left: -24pt;
}

input[type="checkbox"] {
    width: 12pt;
    height: 12pt;
    margin-right: 8pt;
    vertical-align: middle;
}

strong {
    font-weight: 600;
    color: #000000;
}

em {
    font-style: italic;
}

/* Table styling for schedule sections */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 11pt;
}

th, td {
    padding: 8pt;
    text-align: left;
    border: 1pt solid #000000;
}

th {
    font-weight: 600;
}

/* Missing info styling */
.missing-info, [data-missing] {
    font-style: italic;
}

/* Ensure good page breaks */
h2, h3 {
    page-break-after: avoid;
}

ul, ol, p {
    orphans: 3;
    widows: 3;
}

/* Accessibility: Good contrast and spacing */
a {
    color: #000000;
    text-decoration: underline;
}
"""


def markdown_to_pdf(markdown_content: str, title: str = "Simplified Syllabus") -> bytes:
    """
    Convert a markdown document to a PDF.
    
    Args:
        markdown_content: The markdown content to convert
        title: The title for the PDF document
        
    Returns:
        PDF file as bytes
    """
    import markdown2
    from weasyprint import HTML, CSS
    
    # Convert markdown to HTML
    html_content = markdown2.markdown(
        markdown_content,
        extras=[
            'tables',
            'fenced-code-blocks',
            'task_list',
            'header-ids',
            'strike',
        ]
    )
    
    # Wrap in full HTML document
    full_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Generate PDF
    pdf_bytes = BytesIO()
    HTML(string=full_html).write_pdf(
        pdf_bytes,
        stylesheets=[CSS(string=PDF_CSS)]
    )
    
    return pdf_bytes.getvalue()


def create_simplified_pdf(
    syllabus_data: Dict[str, Any],
    target_language: str = "en",
    original_filename: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a simplified syllabus and generate a PDF.
    
    Args:
        syllabus_data: The extracted syllabus data
        target_language: Language code for output
        original_filename: The original PDF filename
        
    Returns:
        Dict with 'pdf_bytes', 'markdown', 'language', 'language_name'
    """
    # Create the simplified document
    result = create_and_translate_simplified_syllabus(
        syllabus_data, 
        target_language, 
        original_filename
    )
    
    # Get the final version (translated if available, otherwise English)
    final_markdown = result.get("translated", result["english"])
    
    # Generate PDF
    course_name = syllabus_data.get("courseInfo", {}).get("courseName", "Course")
    title = f"Simplified Syllabus - {course_name}"
    pdf_bytes = markdown_to_pdf(final_markdown, title)
    
    return {
        "pdf_bytes": pdf_bytes,
        "markdown": final_markdown,
        "english_markdown": result["english"],
        "language": result["language"],
        "language_name": result["language_name"],
    }
