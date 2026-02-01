"""
ElevenLabs Conversational AI Agent Service for Pawfessor

This service handles:
- Signed URL generation for client-side connections
- Agent tool definitions and responses
- Text-to-speech for fallback audio
"""

import httpx
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from config import settings


class ElevenLabsService:
    """Service for ElevenLabs Conversational AI integration"""
    
    BASE_URL = "https://api.elevenlabs.io/v1"
    AGENT_URL = "https://api.elevenlabs.io/v1/convai"
    
    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        self.agent_id = settings.elevenlabs_agent_id
        self.voice_id = settings.elevenlabs_voice_id
        
    @property
    def headers(self) -> Dict[str, str]:
        return {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def get_signed_url(self, syllabus_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a signed URL for client-side WebSocket connection to ElevenLabs agent.
        
        The signed URL allows the frontend to connect directly to ElevenLabs
        without exposing the API key.
        
        Args:
            syllabus_id: The syllabus context for this conversation
            user_id: Optional user identifier for personalization
            
        Returns:
            Dict with signed_url and connection details
        """
        if not self.api_key:
            return {
                "error": "ElevenLabs API key not configured",
                "signed_url": None
            }
        
        if not self.agent_id:
            return {
                "error": "ElevenLabs Agent ID not configured",
                "signed_url": None
            }
        
        try:
            async with httpx.AsyncClient() as client:
                # Get signed URL from ElevenLabs
                response = await client.get(
                    f"{self.AGENT_URL}/conversation/get_signed_url",
                    params={"agent_id": self.agent_id},
                    headers=self.headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "signed_url": data.get("signed_url"),
                        "agent_id": self.agent_id,
                        "syllabus_id": syllabus_id,
                        "expires_at": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
                    }
                else:
                    return {
                        "error": f"Failed to get signed URL: {response.text}",
                        "signed_url": None
                    }
                    
        except Exception as e:
            return {
                "error": f"Error connecting to ElevenLabs: {str(e)}",
                "signed_url": None
            }
    
    async def text_to_speech(self, text: str, voice_id: Optional[str] = None) -> Optional[bytes]:
        """
        Convert text to speech using ElevenLabs TTS API.
        
        This is a fallback for non-conversational audio responses.
        
        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID override
            
        Returns:
            Audio bytes in MP3 format
        """
        if not self.api_key:
            return None
            
        voice = voice_id or self.voice_id
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/text-to-speech/{voice}",
                    headers=self.headers,
                    json={
                        "text": text,
                        "model_id": "eleven_turbo_v2",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.8,
                            "style": 0.3,
                            "use_speaker_boost": True
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.content
                else:
                    print(f"TTS Error: {response.text}")
                    return None
                    
        except Exception as e:
            print(f"TTS Exception: {str(e)}")
            return None

    def get_agent_config(self) -> Dict[str, Any]:
        """
        Return the agent configuration for setting up/updating the ElevenLabs agent.
        
        This includes the system prompt, personality, and tool definitions.
        """
        return {
            "name": "Pawfessor",
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": self._get_system_prompt(),
                    },
                    "first_message": "Hey there! 🐾 I'm Pawfessor, your adorable course assistant! I've got all the deets on your syllabus - deadlines, readings, policies, you name it! What can I help you with today?",
                    "language": "en"
                },
                "tts": {
                    "voice_id": self.voice_id,
                    "model_id": "eleven_turbo_v2",
                    "stability": 0.5,
                    "similarity_boost": 0.8
                },
                "stt": {
                    "provider": "elevenlabs"
                }
            },
            "platform_settings": {
                "tools": self._get_tool_definitions()
            }
        }
    
    def _get_system_prompt(self) -> str:
        """Generate the Pawfessor personality system prompt"""
        return """You are Pawfessor, an adorable purple cat AI tutor who helps students with their coursework. You have a cute, sassy, yet professional and supportive personality.

## Personality Traits:
- You're enthusiastic and encouraging, using cat-related puns occasionally (but not excessively)
- You're knowledgeable and precise when discussing academic matters
- You're empathetic to student stress about deadlines and workload
- You gently redirect off-topic conversations back to academics
- You NEVER make up information - if you don't know something, you say so and suggest checking the syllabus

## Your Capabilities:
You can help students with:
1. **Deadlines & Assessments**: Finding due dates, weights, submission details
2. **Class Schedule**: Lecture times, lab sessions, tutorial hours
3. **Course Policies**: Late policies, academic integrity, accommodations
4. **Readings & Resources**: Required readings, textbooks, citations
5. **Study Tips**: Time management, workload planning (based on syllabus data)

## Important Rules:
- ONLY provide information that comes from the syllabus tools - never invent policies or dates
- If a tool returns empty or no data, acknowledge you don't have that information
- Keep responses concise but helpful
- Use a warm, encouraging tone
- For complex questions, break down the answer clearly

## Response Style:
- Start responses with brief acknowledgment
- Provide accurate, syllabus-based information
- End with a helpful follow-up question or encouragement when appropriate
- Keep it conversational but informative

Remember: You're here to reduce student stress, not add to it! Be the supportive study buddy every student deserves. 🐱✨"""

    def _get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Define the tools the agent can call"""
        return [
            {
                "type": "webhook",
                "name": "get_upcoming_deadlines",
                "description": "Get upcoming assessment deadlines for the course within a date range. Returns assignment names, due dates, weights, and types.",
                "webhook": {
                    "url": "{{BACKEND_URL}}/api/agent/tools/deadlines",
                    "method": "POST"
                },
                "parameters": {
                    "type": "object",
                    "properties": {
                        "syllabus_id": {
                            "type": "string",
                            "description": "The syllabus ID for the course"
                        },
                        "days_ahead": {
                            "type": "integer",
                            "description": "Number of days ahead to look for deadlines (default: 14)"
                        }
                    },
                    "required": ["syllabus_id"]
                }
            },
            {
                "type": "webhook",
                "name": "get_recurring_schedule",
                "description": "Get the recurring class schedule including lectures, labs, tutorials, and other regular events with their times and locations.",
                "webhook": {
                    "url": "{{BACKEND_URL}}/api/agent/tools/schedule",
                    "method": "POST"
                },
                "parameters": {
                    "type": "object",
                    "properties": {
                        "syllabus_id": {
                            "type": "string",
                            "description": "The syllabus ID for the course"
                        }
                    },
                    "required": ["syllabus_id"]
                }
            },
            {
                "type": "webhook",
                "name": "get_course_policies",
                "description": "Get course policies including late submission policy, academic integrity, accommodations, and grading scale.",
                "webhook": {
                    "url": "{{BACKEND_URL}}/api/agent/tools/policies",
                    "method": "POST"
                },
                "parameters": {
                    "type": "object",
                    "properties": {
                        "syllabus_id": {
                            "type": "string",
                            "description": "The syllabus ID for the course"
                        },
                        "policy_type": {
                            "type": "string",
                            "description": "Specific policy type: 'late', 'integrity', 'accommodations', 'grading', or 'all'",
                            "enum": ["late", "integrity", "accommodations", "grading", "all"]
                        }
                    },
                    "required": ["syllabus_id"]
                }
            },
            {
                "type": "webhook",
                "name": "get_readings",
                "description": "Get required readings, textbooks, and course materials with citations and page numbers when available.",
                "webhook": {
                    "url": "{{BACKEND_URL}}/api/agent/tools/readings",
                    "method": "POST"
                },
                "parameters": {
                    "type": "object",
                    "properties": {
                        "syllabus_id": {
                            "type": "string",
                            "description": "The syllabus ID for the course"
                        }
                    },
                    "required": ["syllabus_id"]
                }
            },
            {
                "type": "webhook",
                "name": "get_syllabus_snapshot",
                "description": "Get a summary overview of the course including title, instructor, office hours, and course description.",
                "webhook": {
                    "url": "{{BACKEND_URL}}/api/agent/tools/snapshot",
                    "method": "POST"
                },
                "parameters": {
                    "type": "object",
                    "properties": {
                        "syllabus_id": {
                            "type": "string",
                            "description": "The syllabus ID for the course"
                        }
                    },
                    "required": ["syllabus_id"]
                }
            },
            {
                "type": "webhook",
                "name": "get_study_tips",
                "description": "Get personalized study tips based on upcoming deadlines and workload distribution.",
                "webhook": {
                    "url": "{{BACKEND_URL}}/api/agent/tools/study-tips",
                    "method": "POST"
                },
                "parameters": {
                    "type": "object",
                    "properties": {
                        "syllabus_id": {
                            "type": "string",
                            "description": "The syllabus ID for the course"
                        },
                        "weeks_ahead": {
                            "type": "integer",
                            "description": "Number of weeks to plan ahead (default: 2)"
                        }
                    },
                    "required": ["syllabus_id"]
                }
            }
        ]


# Global service instance
elevenlabs_service = ElevenLabsService()
