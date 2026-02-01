# 🐱 Syllabus Kitty - Complete Setup Summary

## 📁 Project Structure Created

```
syllabus-kitty/
├── README.md                          # Main project documentation
├── setup.sh                           # Automated setup script
│
├── frontend/                          # Next.js Frontend
│   ├── app/
│   │   ├── components/
│   │   │   └── UploadSection.tsx     # Main upload component
│   │   ├── page.tsx                  # Home page with Syllabus Kitty header
│   │   └── globals.css               # Cute gradient styling
│   ├── .env.local.example            # Environment template
│   └── package.json
│
├── backend/                           # FastAPI Backend
│   ├── main.py                       # FastAPI app entry point
│   ├── config.py                     # Settings & configuration
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   ├── .gitignore
│   ├── routes/
│   │   ├── syllabus.py              # PDF upload & extraction endpoint
│   │   └── calendar.py              # Calendar integration (future)
│   ├── services/
│   │   ├── gemini_service.py        # Gemini AI integration
│   │   └── calendar_service.py      # Google Calendar integration (future)
│   └── uploads/                     # Temporary PDF storage
│
└── shared/                           # Shared TypeScript Models
    ├── index.ts                      # Main export file
    ├── types/
    │   ├── extracted-span.ts         # NLP extraction primitive
    │   ├── institution.ts            # Institution & date models
    │   ├── teaching-assistant.ts     # TA model
    │   ├── extracted-sections.ts     # Core NLP output
    │   ├── citation.ts               # Citation models
    │   ├── class-schedule.ts         # Recurring events (NEW)
    │   ├── assessment.ts             # Assignments & grading (NEW)
    │   └── syllabus.ts               # Top-level document
    └── examples/
        └── syllabus-example.json     # Complete example
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
./setup.sh
```

Then follow the on-screen instructions!

### System Dependencies (macOS)

The Simplify PDF feature requires system libraries. The setup script will attempt to install these automatically, but you can also install manually:

```bash
brew install pango gdk-pixbuf libffi
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run server (macOS - with library path for PDF generation)
export DYLD_LIBRARY_PATH=/opt/homebrew/lib
python main.py
```

Server runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local and add:
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase dashboard)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)

# Run development server
npm run dev
```

Frontend runs at: http://localhost:3000

## 🎨 Frontend Features

### Modern, Cute UI Design
- **Gradient Background**: Purple → Pink → Orange
- **Large Upload Area**: Drag & drop or click to upload
- **Animated States**: Upload progress with cute animations
- **Preview Cards**: Quick preview of extracted data
- **Info Cards**: Feature highlights with emojis

### Key Components

**UploadSection.tsx**:
- Drag & drop file upload
- File validation (PDF only, max 25MB)
- Direct FastAPI integration
- Automatic JSON download
- Auto-redirect to syllabus view page
- Success/error states with beautiful UI
- Preview of extracted course info

**Syllabus View Page** (`/syllabus/[id]/page.tsx`):
- **PDF Viewer**: Collapsible PDF display with page markers
- **Menu Bar**: Translate, screen reader, and simplify options
- **Assessments List**: Display all assignments, exams, projects with:
  - Type badges with color coding
  - Weight and due date information
  - Expandable list (shows 5, expand for all)
  - Edit/delete buttons on hover
  - Smooth deletion animations
- **Recurring Events List**: Display lectures, labs, DGDs, tutorials with:
  - Count summary (e.g., "3 lectures, 2 labs")
  - Day/time information
  - Location details
  - Edit/delete functionality
- **Calendar Integration**: "Add All to Google Calendar" button

**Activity Cards**:
- Reusable card component for events and assessments
- Hover effects with edit/delete buttons
- Color-coded type badges
- Icons for weight, date, and location

## 🔧 Backend Architecture

### FastAPI Endpoints

**POST /api/syllabus/upload**
- Accepts PDF file
- Uploads to Gemini File API
- Extracts structured data using AI
- Returns JSON object
- Auto-downloads file to client

**GET /api/syllabus/health**
- Health check endpoint

**POST /api/calendar/create** (Coming Soon)
- Create Google Calendar from syllabus

### Gemini Service

The `gemini_service.py` includes:
- File upload to Gemini File API
- Comprehensive extraction prompt covering:
  - Course information
  - Recurring events (Lecture, Lab, DGD, Tutorial, etc.)
  - Assessments with due dates and weights
  - Teaching assistants
  - Institution details
  - Citations
- JSON parsing and validation

### Configuration

Environment variables in `.env`:
```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL_ID=gemini-2.0-flash-exp
MAX_UPLOAD_SIZE_MB=25
ALLOWED_ORIGINS=http://localhost:3000
```

## 📊 TypeScript Models

### New Models Added

**RecurringEvent** (`class-schedule.ts`):
- Flexible `type` field for any terminology
- Day of week array (0-6)
- Time slots with start/end
- Location, instructor, dates
- Context-aware for different schools

**Assessment** (`assessment.ts`):
- Flexible `type` for assignments, exams, projects, etc.
- Due dates and times
- Weight/percentage
- Group work support
- Submission methods

**GradingScheme**:
- All assessments
- Grading scale (letter grades)
- Late policies

### Data Flow

1. **PDF Upload** → Frontend sends to FastAPI
2. **FastAPI** → Uploads to Gemini File API
3. **Gemini AI** → Extracts structured data
4. **Parsing** → Converts to TypeScript models
5. **Response** → JSON sent to frontend
6. **Storage** → Data saved to Supabase (optional)
7. **Download** → Automatic JSON file download
8. **Preview** → UI shows key extracted info

## 🗄️ Supabase Integration

Supabase is used for:
- **Authentication**: User login and registration
- **Data Storage**: Store extracted syllabus data
- **User Management**: Link syllabi to users
- **Real-time updates**: Sync data across sessions

### Setting up Supabase

1. Create account at https://supabase.com
2. Create a new project
3. Go to Project Settings → API
4. Copy your project URL and anon key
5. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 🔮 Future Integration: Google Calendar

The `calendar_service.py` is ready for:
- OAuth2 authentication
- Creating course calendars
- Adding recurring events
- Adding assignment due dates
- Full syllabus → calendar conversion

## 📝 Getting Your API Keys

### Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy key to `backend/.env`

### Supabase Keys

1. Go to: https://app.supabase.com
2. Select your project
3. Go to Project Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Add to `frontend/.env.local`

### Google Calendar API (Future)

1. Go to: https://console.cloud.google.com/
2. Create new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Download `credentials.json` to backend/

## 🎯 How It Works

### The AI Prompt

The Gemini extraction prompt is designed to:
- Extract ALL course information
- Handle different school terminologies
- Support partial/missing data
- Preserve confidence scores
- Convert formats (days to numbers, times to 24-hour)
- Return clean JSON matching TypeScript models

### Context Awareness

The system handles:
- Different names for recurring events (DGD, Tutorial, Recitation, etc.)
- Different assessment types (Problem Set, Essay, Lab Report, etc.)
- Missing information gracefully
- Various date/time formats

## 💡 Usage Example

1. **Upload PDF**: Drag syllabus to upload area
2. **Processing**: AI extracts information
3. **Download**: JSON file auto-downloads
4. **Review**: Preview shows key course info
5. **Later**: JSON can be used for calendar creation

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.9+)
- Activate virtual environment
- Verify GEMINI_API_KEY in .env

### Frontend won't start
- Check Node.js version (18+)
- Run `npm install`
- Check port 3000 is available

### Supabase connection errors
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
- Check project is not paused in Supabase dashboard
- Restart Next.js dev server after adding env vars

### CORS errors
- Verify backend is running
- Check ALLOWED_ORIGINS in backend/.env
- Verify frontend URL matches

### Upload fails
- File must be PDF
- Max size 25MB
- Check Gemini API key is valid

## 🎉 What You Have Now

✅ Complete backend with FastAPI + Gemini AI
✅ Modern, cute frontend with Next.js + Supabase
✅ User authentication and data persistence
✅ Comprehensive TypeScript models
✅ PDF upload and extraction pipeline
✅ Automatic JSON download
✅ Context-aware extraction
✅ Support for recurring events
✅ Support for assessments
✅ Google Calendar service (ready to implement)
✅ Beautiful UI with gradients and animations
✅ Error handling and validation
✅ Secure environment variable management

## 🚀 Next Steps

1. Get your Gemini API key from https://makersuite.google.com/app/apikey
2. Create a Supabase project at https://supabase.com
3. Run `./setup.sh`
4. Add Gemini API key to `backend/.env`
5. Add Supabase credentials to `frontend/.env.local`
6. Start backend: `cd backend && source venv/bin/activate && python main.py`
7. Start frontend: `cd frontend && npm run dev`
8. Upload a test syllabus PDF!

## 🐛 Troubleshooting

### WeasyPrint / Simplify PDF Errors (macOS)

The Simplify PDF feature uses WeasyPrint which requires system libraries:

**Error**: `cannot load library 'libgobject-2.0-0'` or `No module named 'weasyprint'`

**Solution**:
1. Install system dependencies:
   ```bash
   brew install pango gdk-pixbuf libffi
   ```

2. Set the library path when running the backend:
   ```bash
   export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
   python main.py
   ```

   Or in one line:
   ```bash
   DYLD_LIBRARY_PATH=/opt/homebrew/lib python main.py
   ```

### Missing Python Modules

**Error**: `No module named 'markdown2'` or similar

**Solution**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Gemini Model Errors

**Error**: `models/gemini-X is not found for API version v1beta`

**Solution**: Check your `GEMINI_MODEL_ID` in `backend/.env`. Valid models include:
- `gemini-2.0-flash`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

## 📚 Documentation

- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Supabase Dashboard: https://app.supabase.com
- TypeScript Models: See `shared/types/`
- Example JSON: See `shared/examples/syllabus-example.json`

Happy coding! 🐱✨
