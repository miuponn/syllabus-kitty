""" Unused Agent Routes for ElevenLabs Conversational AI Integration"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from supabase import create_client
from config import settings

router = APIRouter(prefix="/api/agent", tags=["Agent"])

# Initialize Supabase client
supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


# ============ Request/Response Models ============

class SignedUrlRequest(BaseModel):
    syllabus_id: str
    user_id: Optional[str] = None


class ToolRequest(BaseModel):
    syllabus_id: str


class DeadlinesRequest(ToolRequest):
    days_ahead: int = 14


class PoliciesRequest(ToolRequest):
    policy_type: str = "all"


class StudyTipsRequest(ToolRequest):
    weeks_ahead: int = 2


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None


# Signed URL Endpoint

@router.post("/signed-url")
async def get_signed_url(request: SignedUrlRequest):
    """
    Generate a signed URL for the frontend to connect to the ElevenLabs agent.
    This keeps the API key server-side while allowing direct WebSocket connection.
    
    NOTE: ElevenLabs integration temporarily disabled.
    """
    raise HTTPException(
        status_code=501,
        detail="ElevenLabs integration is temporarily disabled"
    )


@router.get("/config")
async def get_agent_config():
    """
    Get the agent configuration for setup/debugging.
    
    NOTE: ElevenLabs integration temporarily disabled.
    """
    return {
        "enabled": False,
        "message": "ElevenLabs integration is temporarily disabled"
    }


# Tool Endpoints (Called by ElevenLabs Agent)

@router.post("/tools/deadlines")
async def get_upcoming_deadlines(request: DeadlinesRequest):
    """
    Tool endpoint: Get upcoming assessment deadlines.
    Called by the ElevenLabs agent when students ask about due dates.
    """
    try:
        # Fetch calendar items for this syllabus
        response = supabase.table("calendar_items").select(
            "id, event_json, type"
        ).eq("syllabus_id", request.syllabus_id).eq("type", "assessment").execute()
        
        if not response.data:
            return {
                "deadlines": [],
                "message": "No assessments found for this course."
            }
        
        deadlines = []
        now = datetime.now()
        cutoff = now + timedelta(days=request.days_ahead)
        
        for item in response.data:
            event = item.get("event_json", {})
            summary = event.get("summary", "Untitled")
            description = event.get("description", "")
            
            # Get the due date
            start = event.get("start", {})
            due_date_str = start.get("dateTime") or start.get("date")
            
            if due_date_str:
                try:
                    # Parse the date
                    if "T" in due_date_str:
                        due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
                    else:
                        due_date = datetime.fromisoformat(due_date_str)
                    
                    # Filter to upcoming deadlines
                    if now <= due_date.replace(tzinfo=None) <= cutoff:
                        # Extract weight if present
                        weight = None
                        weight_match = (summary + " " + description)
                        if "%" in weight_match:
                            import re
                            match = re.search(r"(\d+)%", weight_match)
                            if match:
                                weight = int(match.group(1))
                        
                        deadlines.append({
                            "title": summary,
                            "due_date": due_date_str,
                            "formatted_date": due_date.strftime("%B %d, %Y at %I:%M %p"),
                            "days_until": (due_date.replace(tzinfo=None) - now).days,
                            "weight": weight,
                            "description": description[:200] if description else None,
                            "type": _classify_assessment_type(summary)
                        })
                except (ValueError, TypeError):
                    continue
        
        # Sort by due date
        deadlines.sort(key=lambda x: x["due_date"])
        
        return {
            "deadlines": deadlines,
            "count": len(deadlines),
            "period": f"Next {request.days_ahead} days"
        }
        
    except Exception as e:
        return {"error": str(e), "deadlines": []}


@router.post("/tools/schedule")
async def get_recurring_schedule(request: ToolRequest):
    """
    Tool endpoint: Get recurring class schedule.
    Called when students ask about lecture/lab times.
    """
    try:
        response = supabase.table("calendar_items").select(
            "id, event_json, type"
        ).eq("syllabus_id", request.syllabus_id).eq("type", "recurring_event").execute()
        
        if not response.data:
            return {
                "schedule": [],
                "message": "No recurring schedule found for this course."
            }
        
        schedule = []
        
        for item in response.data:
            event = item.get("event_json", {})
            summary = event.get("summary", "Class")
            location = event.get("location", "")
            recurrence = event.get("recurrence", [])
            
            # Parse day of week from RRULE
            day_of_week = _parse_day_from_rrule(recurrence)
            
            # Parse times
            start = event.get("start", {})
            end = event.get("end", {})
            start_time = _format_time(start.get("dateTime", ""))
            end_time = _format_time(end.get("dateTime", ""))
            
            schedule.append({
                "event_type": _classify_event_type(summary),
                "title": summary,
                "day_of_week": day_of_week,
                "start_time": start_time,
                "end_time": end_time,
                "location": location,
                "time_range": f"{start_time} - {end_time}" if start_time and end_time else ""
            })
        
        # Sort by day of week
        day_order = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
        schedule.sort(key=lambda x: (day_order.get(x["day_of_week"], 7), x["start_time"]))
        
        return {
            "schedule": schedule,
            "count": len(schedule)
        }
        
    except Exception as e:
        return {"error": str(e), "schedule": []}


@router.post("/tools/policies")
async def get_course_policies(request: PoliciesRequest):
    """
    Tool endpoint: Get course policies.
    Called when students ask about late policy, grading, etc.
    """
    try:
        # Fetch the syllabus data
        response = supabase.table("sillabi").select(
            "syllabus_json"
        ).eq("file_id", request.syllabus_id).single().execute()
        
        if not response.data:
            return {
                "policies": {},
                "message": "No syllabus data found."
            }
        
        syllabus = response.data.get("syllabus_json", {})
        extracted = syllabus.get("extracted_sections", {})
        grading = syllabus.get("grading_scheme", {})
        
        policies = {}
        
        # Late policy
        if request.policy_type in ["all", "late"]:
            late_policy = grading.get("late_policy", "")
            if late_policy:
                policies["late_policy"] = late_policy
            else:
                policies["late_policy"] = "No late policy specified in syllabus. Please check with your instructor."
        
        # Grading scale
        if request.policy_type in ["all", "grading"]:
            grading_scale = grading.get("grading_scale", [])
            if grading_scale:
                policies["grading_scale"] = grading_scale
            
            # Assessment breakdown
            assessments = grading.get("assessments", [])
            if assessments:
                breakdown = []
                for a in assessments:
                    if a.get("weight"):
                        breakdown.append({
                            "component": a.get("title", "Unknown"),
                            "weight": f"{a.get('weight')}%"
                        })
                policies["grade_breakdown"] = breakdown
        
        # Assessment strategy / grading rubric
        if request.policy_type in ["all", "grading"]:
            rubric = _extract_span_text(extracted.get("grading_rubric", []))
            strategy = _extract_span_text(extracted.get("assessment_strategy", []))
            if rubric:
                policies["grading_rubric"] = rubric
            if strategy:
                policies["assessment_strategy"] = strategy
        
        return {
            "policies": policies,
            "policy_type": request.policy_type
        }
        
    except Exception as e:
        return {"error": str(e), "policies": {}}


@router.post("/tools/readings")
async def get_readings(request: ToolRequest):
    """
    Tool endpoint: Get required readings and materials.
    Called when students ask about textbooks or readings.
    """
    try:
        response = supabase.table("sillabi").select(
            "syllabus_json"
        ).eq("file_id", request.syllabus_id).single().execute()
        
        if not response.data:
            return {
                "readings": [],
                "message": "No syllabus data found."
            }
        
        syllabus = response.data.get("syllabus_json", {})
        extracted = syllabus.get("extracted_sections", {})
        citations = syllabus.get("citations", [])
        
        readings = {
            "required_reading": [],
            "citations": []
        }
        
        # Get required reading from extracted sections
        required = extracted.get("required_reading", [])
        if required:
            readings["required_reading"] = _extract_span_text(required)
        
        # Get citations
        if citations:
            for citation in citations[:10]:  # Limit to 10
                readings["citations"].append({
                    "title": citation.get("title", ""),
                    "author": citation.get("author", ""),
                    "year": citation.get("year", ""),
                    "isbn": citation.get("isbn", ""),
                    "type": citation.get("type", "book")
                })
        
        return readings
        
    except Exception as e:
        return {"error": str(e), "readings": {}}


@router.post("/tools/snapshot")
async def get_syllabus_snapshot(request: ToolRequest):
    """
    Tool endpoint: Get a course overview snapshot.
    Called when students ask general questions about the course.
    """
    try:
        response = supabase.table("sillabi").select(
            "syllabus_json, course_name"
        ).eq("file_id", request.syllabus_id).single().execute()
        
        if not response.data:
            return {
                "snapshot": {},
                "message": "No syllabus data found."
            }
        
        syllabus = response.data.get("syllabus_json", {})
        extracted = syllabus.get("extracted_sections", {})
        institution = syllabus.get("institution", {})
        date_info = syllabus.get("date", {})
        
        snapshot = {
            "course_title": _extract_span_text(extracted.get("title", [])) or response.data.get("course_name", ""),
            "course_code": _extract_span_text(extracted.get("code", [])),
            "section": _extract_span_text(extracted.get("section", [])),
            "instructor": _extract_span_text(extracted.get("instructor", [])),
            "institution": institution.get("name", ""),
            "term": f"{date_info.get('term', '')} {date_info.get('year', '')}".strip(),
            "description": _extract_span_text(extracted.get("description", []))[:500] if extracted.get("description") else "",
            "office_hours": {
                "days": _extract_span_text(extracted.get("office_hours_days", [])),
                "times": _extract_span_text(extracted.get("office_hours_times", [])),
                "location": _extract_span_text(extracted.get("office_location", []))
            },
            "credits": _extract_span_text(extracted.get("credits", [])),
            "learning_outcomes": _extract_span_text(extracted.get("learning_outcomes", []))[:500] if extracted.get("learning_outcomes") else ""
        }
        
        # Clean up empty values
        snapshot = {k: v for k, v in snapshot.items() if v}
        
        return {"snapshot": snapshot}
        
    except Exception as e:
        return {"error": str(e), "snapshot": {}}


@router.post("/tools/study-tips")
async def get_study_tips(request: StudyTipsRequest):
    """
    Tool endpoint: Generate study tips based on upcoming workload.
    Called when students ask for study advice.
    """
    try:
        # Get upcoming deadlines
        deadlines_response = await get_upcoming_deadlines(
            DeadlinesRequest(syllabus_id=request.syllabus_id, days_ahead=request.weeks_ahead * 7)
        )
        
        deadlines = deadlines_response.get("deadlines", [])
        
        tips = {
            "workload_summary": "",
            "suggestions": [],
            "priority_items": []
        }
        
        if not deadlines:
            tips["workload_summary"] = "No upcoming deadlines in the next few weeks. Great time to get ahead on readings!"
            tips["suggestions"] = [
                "Review lecture notes while they're fresh",
                "Start any long-term projects early",
                "Use this time to strengthen weak areas"
            ]
        else:
            # Calculate workload
            high_weight = [d for d in deadlines if d.get("weight") and d["weight"] >= 15]
            urgent = [d for d in deadlines if d.get("days_until", 999) <= 3]
            
            tips["workload_summary"] = f"You have {len(deadlines)} deadline(s) in the next {request.weeks_ahead} week(s)."
            
            if urgent:
                tips["priority_items"] = [
                    {"title": d["title"], "due_in": f"{d['days_until']} day(s)", "weight": d.get("weight")}
                    for d in urgent
                ]
                tips["suggestions"].append("🚨 Focus on urgent items first!")
            
            if high_weight:
                tips["suggestions"].append(f"📊 {len(high_weight)} major assignment(s) worth 15%+ - allocate extra time!")
            
            # General tips based on count
            if len(deadlines) >= 3:
                tips["suggestions"].append("📅 Consider creating a daily schedule to manage multiple deadlines")
                tips["suggestions"].append("🎯 Break large tasks into smaller, manageable chunks")
            
            tips["suggestions"].append("💪 Remember to take breaks - the Pomodoro technique works great!")
            tips["suggestions"].append("🌙 Get enough sleep before exams and due dates")
        
        return tips
        
    except Exception as e:
        return {"error": str(e), "tips": {}}


# ============ Text-to-Speech Fallback ============

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Generate speech audio from text.
    Fallback for when WebSocket conversation isn't available.
    
    NOTE: ElevenLabs integration temporarily disabled.
    """
    raise HTTPException(
        status_code=501,
        detail="ElevenLabs TTS integration is temporarily disabled"
    )


# ============ Helper Functions ============

def _extract_span_text(spans: List[Dict[str, Any]]) -> str:
    """Extract text from ExtractedSpan array"""
    if not spans:
        return ""
    texts = [span.get("text", "") for span in spans if span.get("text")]
    return " ".join(texts).strip()


def _parse_day_from_rrule(recurrence: List[str]) -> str:
    """Parse day of week from RRULE string"""
    if not recurrence:
        return "Unknown"
    
    day_map = {
        "MO": "Monday", "TU": "Tuesday", "WE": "Wednesday",
        "TH": "Thursday", "FR": "Friday", "SA": "Saturday", "SU": "Sunday"
    }
    
    import re
    for rule in recurrence:
        match = re.search(r"BYDAY=([A-Z,]+)", rule)
        if match:
            days = match.group(1).split(",")
            return ", ".join(day_map.get(d, d) for d in days)
    
    return "Unknown"


def _format_time(iso_string: str) -> str:
    """Format ISO datetime to time string"""
    if not iso_string:
        return ""
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        return dt.strftime("%I:%M %p").lstrip("0")
    except:
        return ""


def _classify_event_type(summary: str) -> str:
    """Classify event type from summary"""
    lower = summary.lower()
    if "lecture" in lower:
        return "Lecture"
    if "lab" in lower:
        return "Lab"
    if "tutorial" in lower:
        return "Tutorial"
    if "dgd" in lower:
        return "DGD"
    if "office" in lower:
        return "Office Hours"
    return "Class"


def _classify_assessment_type(summary: str) -> str:
    """Classify assessment type from summary"""
    lower = summary.lower()
    if "exam" in lower or "final" in lower or "midterm" in lower:
        return "Exam"
    if "quiz" in lower:
        return "Quiz"
    if "project" in lower:
        return "Project"
    if "assignment" in lower or "homework" in lower:
        return "Assignment"
    if "presentation" in lower:
        return "Presentation"
    if "essay" in lower or "paper" in lower:
        return "Paper"
    return "Assessment"
