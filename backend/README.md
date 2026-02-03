# Syllabus Kitty Backend 

Backend API for Syllabus Kitty - AI-powered syllabus extraction, simplification, translation, and calendar generation.

## Quick Start

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install System Dependencies (macOS)

WeasyPrint requires system libraries for PDF generation:

```bash
brew install pango gdk-pixbuf libffi
```

### 4. Configure Environment

Copy `.env.local` to `.env` and fill in your values:

```bash
cp .env.local .env
```

See [Environment Variables](#environment-variables) below for details.

### 5. Run the Server

```bash
# If WeasyPrint has library issues on macOS:
DYLD_LIBRARY_PATH=/opt/homebrew/lib python main.py

# Or standard:
python main.py
```

The API will be available at: http://localhost:8000

## API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI API key for Gemini |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Optional - Email Notifications

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_SERVER` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | Email username | - |
| `SMTP_PASSWORD` | App password (not regular password) | - |
| `SMTP_FROM_EMAIL` | Sender email address | - |
| `NOTIFICATION_ADVANCE_DAYS` | Days before due date to send reminder | `10` |
| `TIMEZONE` | Timezone for scheduling | `America/Toronto` |

### Optional - Server Config

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Enable debug mode | `true` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for extension | `http://localhost:3000` |
| `MAX_UPLOAD_SIZE_MB` | Max file upload size | `25` |

## Getting API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

### Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings → API
4. Copy the **Project URL** → `SUPABASE_URL`
5. Copy the **service_role key** (not anon key) → `SUPABASE_SERVICE_ROLE_KEY`

### Gmail App Password (for email reminders)

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Create a new App Password for "Mail"
4. Add it to `.env` as `SMTP_PASSWORD`

### Google Calendar API (optional - for server-side calendar)

> Note: The Chrome extension uses Chrome Identity API instead, so this is only needed for server-side calendar integration.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Download `credentials.json` to the backend directory

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration and settings
├── requirements.txt           # Python dependencies
├── .env.local                 # Environment template
├── routes/
│   ├── syllabus.py            # Syllabus extraction & calendar endpoints
│   ├── simplify.py            # Simplification & translation endpoints
│   ├── extension.py           # Chrome extension API endpoints
│   └── agent.py               # (unused) ElevenLabs agent stubs
├── services/
│   ├── gemini_service.py      # Gemini AI integration
│   ├── supabase_service.py    # Supabase database operations
│   ├── simplified_syllabus_service.py  # Simplification & PDF generation
│   ├── email_service.py       # SMTP email sending
│   ├── email_notification_service.py   # Reminder scheduling
│   └── gmail_notification_service.py   # Gmail-specific notifications
└── uploads/                   # Temporary file storage
```

## Troubleshooting

### "Module not found" errors

Make sure venv is activated and dependencies are installed:
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### WeasyPrint / PDF Generation errors (macOS)

If you see "cannot load library 'libgobject-2.0-0'" errors:

```bash
# Install system dependencies
brew install pango gdk-pixbuf libffi

# Run with library path
DYLD_LIBRARY_PATH=/opt/homebrew/lib python main.py
```

**Still not working?** Try:
```bash
# Reinstall WeasyPrint
pip uninstall weasyprint
pip install weasyprint

# Or set path permanently in your shell profile
echo 'export DYLD_LIBRARY_PATH=/opt/homebrew/lib' >> ~/.zshrc
source ~/.zshrc
```

### CORS errors

Check that your frontend URL is in `ALLOWED_ORIGINS` in `.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Gemini API errors

- Verify your API key is correct
- Check you have quota remaining at [Google AI Studio](https://makersuite.google.com/)
- Ensure the model ID is valid: `GEMINI_MODEL_ID=gemini-3.0-flash`

**"500 Internal Server Error" on extraction:**
- PDF might be too large - try a smaller file first
- PDF might be image-based (scanned) - Gemini needs text-based PDFs
- Check terminal for the actual error message

### Supabase connection errors

- Verify `SUPABASE_URL` starts with `https://`
- Make sure you're using the **service_role** key, not the anon key
- Check your Supabase project is active (not paused)

**"Invalid API key" errors:**
- Service role key is different from anon key - check Dashboard → Settings → API
- Key might have been regenerated - copy fresh from Supabase

### Google Calendar API errors

**"Invalid credentials" or token errors:**
- Google access token may have expired (they last ~1 hour)
- Sign out and sign back in on the frontend to refresh tokens
- Verify Google OAuth is configured in Supabase with correct scopes:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`

**"Insufficient permission" errors:**
- User may not have granted calendar permissions
- Sign out, sign back in, and accept all permission prompts

### Port already in use

```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn main:app --port 8001
```

### File upload errors

**"File too large":**
- Default limit is set in FastAPI - check `main.py` for max size
- Large PDFs might timeout during processing

**"Invalid file type":**
- Only PDF files are supported
- Make sure the file extension is `.pdf` (case-insensitive)