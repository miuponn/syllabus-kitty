# Syllabus Kitty 🐱

A modern, AI-powered web application that extracts structured information from syllabus PDFs and prepares it for Google Calendar integration.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Supabase account and project from [Supabase](https://supabase.com)
- **macOS only**: Homebrew for system dependencies

### System Dependencies (macOS)

The Simplify PDF feature uses WeasyPrint which requires system libraries:

```bash
brew install pango gdk-pixbuf libffi
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local and add your Supabase credentials
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. Run the FastAPI server:
```bash
python main.py
```

**Note (macOS)**: If PDF generation fails with library errors, run:
```bash
export DYLD_LIBRARY_PATH=/opt/homebrew/lib && python main.py
```

The API will be available at [http://localhost:8000](http://localhost:8000)

## 📁 Project Structure

```
syllabus-kitty/
├── frontend/           # Next.js frontend
│   ├── app/
│   │   ├── components/ # React components
│   │   │   ├── UploadSection.tsx
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── MenuBar.tsx
│   │   │   ├── ActivityCard.tsx
│   │   │   ├── AssessmentsList.tsx
│   │   │   └── RecurringEventsList.tsx
│   │   ├── syllabus/[id]/  # Dynamic syllabus view
│   │   │   └── page.tsx
│   │   ├── page.tsx   # Main upload page
│   │   └── globals.css
│   └── package.json
├── backend/            # FastAPI backend
│   ├── main.py        # API entry point
│   ├── config.py      # Configuration
│   ├── routes/        # API routes
│   └── services/      # Gemini & Calendar services
└── shared/            # Shared TypeScript types
    └── types/         # Type definitions
```

## ✨ Features

- 📄 **PDF Upload**: Drag & drop or click to upload syllabus PDFs
- 🤖 **AI Extraction**: Powered by Google Gemini AI
- 📊 **Structured Data**: Extracts courses, schedules, assignments, and more
- �️ **Interactive Viewer**: View PDF alongside extracted assessments and events
- ✏️ **Edit & Manage**: Edit, delete, or add new assessments and recurring events
- 🌐 **Accessibility**: Translate, screen reader, and simplify options
- 💾 **JSON Export**: Download extracted data as JSON
- 📅 **Calendar Integration**: Add all events to Google Calendar with one click (coming soon)

## 🎨 Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend
- FastAPI
- Python 3.9+
- Google Generative AI (Gemini)
- Google Calendar API (for future integration)

### Database
- Supabase (PostgreSQL)
- Authentication & user management

## 📝 API Endpoints

- `POST /api/syllabus/upload` - Upload and process syllabus PDF
- `GET /api/syllabus/health` - Health check
- `POST /api/calendar/create` - Create calendar (coming soon)
- `GET /docs` - Interactive API documentation

## 🔮 Coming Soon

- [ ] Google Calendar integration
- [ ] Multi-file upload
- [ ] Model fine-tuning support
- [ ] Data persistence
- [ ] User authentication
- [ ] Calendar event management

## 📄 License

MIT
