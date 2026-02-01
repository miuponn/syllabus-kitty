# 🐱 Pawfessor AI Chat Setup Guide

Pawfessor is an AI-powered conversational tutor that helps students with their coursework using ElevenLabs Agents for voice interactions.

## Features

- **💬 Text Chat**: Ask questions about deadlines, schedule, policies, and readings
- **🎙️ Voice Conversations**: Speak directly with Pawfessor using ElevenLabs real-time voice
- **🔊 Text-to-Speech**: Hear responses read aloud
- **🐱 Cute Personality**: Sassy yet professional, supportive study buddy

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Backend (API)   │────▶│   Supabase DB   │
│   (Next.js)     │     │  (FastAPI)       │     │   (Syllabus)    │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │                       │
         │    ┌──────────────────┘
         │    ▼
         │  ┌─────────────────┐
         └─▶│  ElevenLabs     │
            │  Agents API     │
            └─────────────────┘
```

## Setup Instructions

### 1. Get ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/) and create an account
2. Navigate to your [API Keys](https://elevenlabs.io/app/settings/api-keys)
3. Create a new API key
4. Copy the key

### 2. Create an ElevenLabs Agent

1. Go to [ElevenLabs Agents](https://elevenlabs.io/app/agents)
2. Create a new agent with these settings:
   - **Name**: Pawfessor
   - **Voice**: Choose a friendly voice (Rachel, Adam, etc.)
   - **System Prompt**: Copy from [backend/services/elevenlabs_service.py](backend/services/elevenlabs_service.py#L147-L183)
3. Configure the tools (webhooks) - see [Tool Configuration](#tool-configuration) below
4. Copy the Agent ID

### 3. Update Backend Environment

Add to `backend/.env`:

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Optional: change voice
```

### 4. Update Frontend Environment

Create/update `frontend/.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 5. Install Dependencies

Backend:
```bash
cd backend
pip install httpx
```

Frontend:
```bash
cd frontend
npm install @11labs/client
```

## Tool Configuration

When creating your ElevenLabs agent, add these webhook tools:

### get_upcoming_deadlines
- **URL**: `https://your-backend-url/api/agent/tools/deadlines`
- **Method**: POST
- **Description**: Get upcoming assessment deadlines

### get_recurring_schedule
- **URL**: `https://your-backend-url/api/agent/tools/schedule`
- **Method**: POST  
- **Description**: Get class schedule (lectures, labs, tutorials)

### get_course_policies
- **URL**: `https://your-backend-url/api/agent/tools/policies`
- **Method**: POST
- **Description**: Get course policies (late, grading, etc.)

### get_readings
- **URL**: `https://your-backend-url/api/agent/tools/readings`
- **Method**: POST
- **Description**: Get required readings and materials

### get_syllabus_snapshot
- **URL**: `https://your-backend-url/api/agent/tools/snapshot`
- **Method**: POST
- **Description**: Get course overview

### get_study_tips
- **URL**: `https://your-backend-url/api/agent/tools/study-tips`
- **Method**: POST
- **Description**: Get study tips based on workload

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/signed-url` | POST | Get signed URL for WebSocket connection |
| `/api/agent/config` | GET | Get agent configuration |
| `/api/agent/tools/deadlines` | POST | Get upcoming deadlines |
| `/api/agent/tools/schedule` | POST | Get recurring schedule |
| `/api/agent/tools/policies` | POST | Get course policies |
| `/api/agent/tools/readings` | POST | Get readings & materials |
| `/api/agent/tools/snapshot` | POST | Get course overview |
| `/api/agent/tools/study-tips` | POST | Get study recommendations |
| `/api/agent/tts` | POST | Text-to-speech fallback |

## Usage

1. Open a syllabus page at `/syllabus/[id]`
2. Click the purple Pawfessor button in the bottom-left corner
3. Ask questions via text or click the mic button for voice
4. Use quick action buttons for common queries

## Fallback Mode

If ElevenLabs is not configured or unavailable:
- Text chat still works via direct API calls
- TTS is available if API key is set
- Error messages guide users gracefully

## Security Notes

- ElevenLabs API key is **server-side only**
- Frontend connects via signed URLs (expires in 10 minutes)
- Agent only sees syllabus data through tool calls
- No raw PDF content is exposed to the agent

## Demo Tips for Judges

When demoing Pawfessor:

1. **Show the context-aware design**: "Pawfessor doesn't see the whole PDF - it only gets what it needs through specific tool calls"
2. **Demonstrate voice**: Ask "What are my deadlines next week?"
3. **Show structured responses**: Ask about policies or schedule
4. **Highlight personality**: The agent is cute and supportive

## Troubleshooting

### "Voice features unavailable"
- Check ELEVENLABS_API_KEY is set
- Verify agent ID is correct
- Check browser microphone permissions

### "Could not connect to voice assistant"
- Ensure backend is running
- Check CORS settings
- Verify signed URL endpoint works

### No audio playback
- Check browser audio permissions
- Verify mute button isn't active
- Check console for TTS errors
