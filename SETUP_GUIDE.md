# 🐱 Syllabus Kitty - Complete Setup Guide

A comprehensive guide to setting up and running the full Syllabus Kitty project.

---

## Documentation Options

This project offers multiple ways to get started, depending on your needs:

| Option | Best For | Documentation |
|--------|----------|---------------|
| **Quick Start Script** | New developers, full setup | `./setup.sh` |
| **Backend Only** | API development, testing | [backend/README.md](backend/README.md) |
| **Frontend Only** | UI development | [frontend/README.md](frontend/README.md) |
| **Extension Only** | Chrome extension development | [extension/README.md](extension/README.md) |
| **This Guide** | Complete understanding, troubleshooting | You're here! |

---

## Project Structure

```
syllabus-kitty/
├── README.md                    # Project overview
├── SETUP_GUIDE.md               # This comprehensive guide
├── setup.sh                     # Automated setup script
│
├── backend/                    # FastAPI Backend
│   ├── main.py                 # API entry point
│   ├── config.py               # Settings & configuration
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (gitignored)
│   ├── routes/
│   │   ├── syllabus.py        # PDF upload, extraction, calendar
│   │   ├── simplify.py        # Simplification, translation, PDF generation
│   │   ├── extension.py       # Chrome extension API endpoints
│   │   └── agent.py           # (unused) ElevenLabs agent stubs
│   ├── services/
│   │   ├── gemini_service.py  # Gemini AI integration
│   │   ├── supabase_service.py # Database operations
│   │   ├── simplified_syllabus_service.py # PDF generation
│   │   ├── email_service.py   # SMTP email sending
│   │   └── calendar_service.py # Google Calendar integration
│   └── uploads/                # Temporary file storage
│
├── frontend/                    # Next.js 14 Frontend
│   ├── app/
│   │   ├── auth/callback/     # Supabase OAuth callback
│   │   ├── components/        # React components
│   │   ├── lib/               # Supabase client
│   │   ├── providers/         # Auth context provider
│   │   ├── syllabus/[id]/     # Dynamic syllabus view page
│   │   ├── page.tsx           # Home/upload page
│   │   └── layout.tsx         # Root layout with Navbar
│   ├── public/assets/         # Static assets
│   ├── .env                   # Default env vars (committed)
│   └── .env.local             # Secret env vars (gitignored)
│
├── extension/                 # Chrome Extension (MV3)
│   ├── manifest.json          # Extension manifest
│   ├── popup/                 # Extension popup UI
│   ├── background/            # Service worker & API client
│   ├── content/               # Content script for page extraction
│   └── icons/                 # Extension icons
│
└── shared/                    # (Mostly unused) shared TypeScript Types
    ├── types/                 # Type definitions
    └── examples/              # Example JSON data
```

---

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/syllabus-kitty.git
cd syllabus-kitty

# Run setup script
chmod +x setup.sh
./setup.sh
```

The script will:
1. Check prerequisites (Python 3.9+, Node.js 18+)
2. Install system dependencies (macOS: WeasyPrint libraries)
3. Set up backend virtual environment and dependencies
4. Set up frontend npm dependencies
5. Create environment file templates
6. Display instructions for API keys and running the app

### Option 2: Manual Setup

Follow the individual READMEs:
1. [Backend Setup](backend/README.md)
2. [Frontend Setup](frontend/README.md)
3. [Extension Setup](extension/README.md)

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key          # From Google AI Studio
SUPABASE_URL=https://xxx.supabase.co        # From Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # From Supabase Dashboard (service_role)

# Optional - Server
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000

# Optional - Gemini
GEMINI_MODEL_ID=gemini-3.0-flash

# Optional - Email Notifications
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password             # Gmail App Password, not regular password
```

### Frontend (`frontend/.env.local`)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # anon/public key (different from service_role!)

# Optional (has default)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Extension (`extension/manifest.json`)

For Google Calendar integration, update the OAuth client ID:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/calendar"]
}
```

---

## Getting API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy to `backend/.env` → `GEMINI_API_KEY`

### Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a project
2. Navigate to **Settings → API**
3. Copy:
   - **Project URL** → Both backend and frontend
   - **anon/public key** → `frontend/.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `backend/.env` → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: The frontend uses the `anon` key, the backend uses the `service_role` key. Don't mix them up!

### Google OAuth (for Extension Calendar)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Calendar API**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Select **Chrome Extension** as application type
6. Add your extension ID (find it in `chrome://extensions/`)
7. Copy the Client ID to `extension/manifest.json`

### Gmail App Password (for Email Notifications)

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Copy to `backend/.env` → `SMTP_PASSWORD`

---

## Running the Application

### Start Backend

```bash
cd backend
source venv/bin/activate

# Standard
python main.py

# macOS with PDF generation (if WeasyPrint has issues)
DYLD_LIBRARY_PATH=/opt/homebrew/lib python main.py
```

Server runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:3000

### Load Extension

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder

---

## Features

### Web Application

| Feature | Description |
|---------|-------------|
| **PDF Upload** | Drag & drop syllabus PDFs for AI extraction |
| **AI Extraction** | Gemini AI extracts course info, events, assessments |
| **Calendar View** | View and edit extracted events and assessments |
| **Add to Calendar** | Send events directly to Google Calendar |
| **Simplify** | Generate simplified PDF version |
| **Translate** | Translate to 15+ languages |
| **Download PDF** | Export simplified/translated versions |

### Chrome Extension

| Feature | Description |
|---------|-------------|
| **Auto-Detect** | Detect syllabus content on any webpage |
| **PDF & HTML Support** | Works with PDFs, embedded viewers, and HTML pages |
| **Simplify & Translate** | Same features as web app, in-browser |
| **Add to Calendar** | Google Calendar integration via Chrome Identity API |
| **Session Persistence** | Remembers extraction per URL for 24 hours |

---

## Backend API Endpoints

### Syllabus Routes (`/api/syllabus`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload PDF and extract with Gemini AI |
| `GET` | `/{file_id}` | Get syllabus data by ID |
| `POST` | `/{file_id}/add-to-calendar` | Add events to Google Calendar |
| `GET` | `/health` | Health check |

### Simplify Routes (`/api/simplify`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Simplify syllabus content |
| `POST` | `/pdf` | Generate simplified PDF |
| `POST` | `/translate` | Translate simplified content |
| `GET` | `/languages` | Get supported languages |

### Extension Routes (`/api/extension`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/import-text` | Import text content from extension |
| `POST` | `/import-pdf-url` | Import PDF from URL |
| `POST` | `/simplify` | Simplify for extension |
| `POST` | `/translate` | Translate for extension |
| `POST` | `/add-to-calendar` | Add to calendar from extension |
| `POST` | `/generate-pdf` | Generate PDF for extension |

---

## Data Schema (Supabase)

### Tables

**syllabi**
- `file_id` (primary key)
- `user_id` (foreign key to auth.users)
- `course_name`
- `pdf_url`
- `simplified_markdown`
- `created_at`

**calendar_items**
- `id` (primary key)
- `syllabus_id` (foreign key to syllabi)
- `type` ('assessment' | 'recurring_event')
- `event_json` (JSONB)
- `created_at`

---

## Troubleshooting

### Common Issues

See individual READMEs for detailed troubleshooting:
- [Backend Troubleshooting](backend/README.md#troubleshooting)
- [Frontend Troubleshooting](frontend/README.md#troubleshooting)
- [Extension Troubleshooting](extension/README.md#troubleshooting)

### Quick Fixes

| Issue | Solution |
|-------|----------|
| **Port already in use** | `lsof -ti:8000 \| xargs kill -9` |
| **WeasyPrint errors (macOS)** | `brew install pango gdk-pixbuf libffi` then run with `DYLD_LIBRARY_PATH=/opt/homebrew/lib` |
| **CORS errors** | Check `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL |
| **Supabase auth not working** | Add `http://localhost:3000/auth/callback` to Supabase redirect URLs |
| **Extension not detecting** | Make sure backend is running, check browser console for errors |
| **Calendar button doesn't work** | Configure OAuth client ID in `manifest.json` |

---

## Workflow

### Typical Session

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate
DYLD_LIBRARY_PATH=/opt/homebrew/lib python main.py

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser: Extension
# Load unpacked from chrome://extensions/
```

### Making Changes

- **Backend**: Changes auto-reload (FastAPI with `--reload` by default)
- **Frontend**: Changes auto-reload (Next.js hot reload)
- **Extension**: Click "Reload" button in `chrome://extensions/` after changes

---

## Stack

| Layer | Tools |
|-------|------------|
| **Frontend** | Next.js 14, React, Tailwind CSS, TypeScript |
| **Backend** | FastAPI, Python 3.9+, Pydantic |
| **AI** | Google Gemini AI (gemini-3.0-flash) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth with Google OAuth |
| **PDF Generation** | WeasyPrint, Markdown2 |
| **Extension** | Chrome MV3 |
| **Calendar** | Google Calendar API |

---

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_URL` (your deployed backend URL)

### Backend

Options: Railway, Render, Fly.io, Google Cloud Run, AWS Lambda

Key considerations:
- Set all environment variables
- WeasyPrint requires system libraries (use Docker or a platform that supports them)
- Configure CORS for your frontend domain

### Extension

1. Update `manifest.json` with production backend URL
2. Create a [Chrome Web Store Developer account](https://chrome.google.com/webstore/devconsole/)
3. Package and upload the extension

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

---

Happy coding! 🐱✨
