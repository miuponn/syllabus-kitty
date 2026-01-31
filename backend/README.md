# Syllabus Kitty Backend 🐱

Backend API for Syllabus Kitty - AI-powered syllabus extraction and calendar generation.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

## 📚 API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔑 Getting API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### Google Calendar API (for later)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Download `credentials.json` to the backend directory

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration and settings
├── requirements.txt       # Python dependencies
├── routes/
│   ├── syllabus.py       # Syllabus extraction endpoints
│   └── calendar.py       # Calendar integration endpoints
├── services/
│   ├── gemini_service.py # Gemini AI integration
│   └── calendar_service.py # Google Calendar integration
└── uploads/              # Temporary file storage
```

## 🐛 Troubleshooting

### "Module not found" errors
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### CORS errors
Check that your frontend URL is in `ALLOWED_ORIGINS` in `.env`

### Gemini API errors
Verify your API key is correct and has proper permissions
