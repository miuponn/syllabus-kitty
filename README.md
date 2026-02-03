# Syllabus Kitty

**For clarity, not clutter.** Meow. Entry for Shehacks 10. 

**Turn any syllabus into your personal academic assistant.**

Syllabus Kitty is an AI-powered tool that transforms chaotic syllabus PDFs into organized, actionable data. Upload a syllabus, get a clear schedule, and sync everything to Google Calendar. Syllabus Kitty comes in a fully-fleshed web application and Chrome extension form for when you're stuck on Brightspace, Blackboard, ACORN, so on... 

## The Problem

Students receive syllabi in inconsistent formats. Some are 20-page PDFs, others are HTML pages on your professor's random website, some are scanned images. Manually creating new calendar events for all your midterms, labs, and random one-off assignments isn't that bad until it is.Sometimes you're too busy actually doing your homework than to pre-occupy yourself with writing down what your homework is. Not to mention the syllabus is 32+ pages long and buried in academic lingo, and the required readings and teaching assistants' emails are on page 31. As per usual, it's pretty unfriendly to those of us that have certain cognitive disabilities, second language learners, or otherwise just need a bit of streamlining sometimes. It's an issue that hits close to home for us, for sure.

## Our Solution

Syllabus Kitty bridges the gap between receiving a your academic guide for the semester and actually using it:

- **Upload or Detect** — Drag & drop a PDF on the web app, or use the Chrome extension to detect syllabi on any webpage
- **AI Extraction** — AI extracts course info, assessments, due dates, and recurring events automatically
- **Review & Edit** — See everything in a clean interface, edit mistakes, add missing items
- **Simplify & Translate** — Generate a simplified version in plain English, or translate to 15+ languages
- **Sync to Calendar** — Add all events to Google Calendar with one click
- **Download PDF** — Export a clean, simplified PDF for offline reference

## Features

| Feature | Web App | Chrome Extension |
|---------|---------|------------------|
| PDF Upload | ✅ Drag & drop | ✅ Auto-detect on page |
| AI Extraction | ✅ | ✅ |
| Simplify | ✅ | ✅ |
| Translate (15+ languages) | ✅ | ✅ |
| Google Calendar Sync | ✅ | ✅ |
| Download PDF | ✅ | ✅ |
| Detects syllabi on your browser | ❌ | ✅ |

## Getting Started

### Quick Start (Recommended)

```bash
git clone https://github.com/your-username/syllabus-kitty.git
cd syllabus-kitty
./setup.sh
```

### Prerequisites

| Requirement | Where to Get It |
|-------------|-----------------|
| Node.js 18+ | [nodejs.org](https://nodejs.org) |
| Python 3.9+ | [python.org](https://python.org) |
| Gemini API Key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| Supabase Project | [supabase.com](https://supabase.com) |
| Homebrew (macOS) | [brew.sh](https://brew.sh) — for PDF generation libraries |

### Running the App

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate
python main.py

# Terminal 2: Frontend  
cd frontend && npm run dev

# Browser: Extension
# Load unpacked from chrome://extensions/
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

##  Structure

```
syllabus-kitty/
├── frontend/          # Next.js web application
├── backend/           # FastAPI server + Gemini AI
├── extension/         # Chrome extension
├── shared/            # Unused shared TypeScript types
├── setup.sh           # Automated setup script
└── SETUP_GUIDE.md     # Setup docs
```

## Docs

| Guide | Description |
|-------|-------------|
| [**setup.sh**](setup.sh) | Try this first — automated shell script for everything |
| [**SETUP_GUIDE.md**](SETUP_GUIDE.md) | Complete reference: env vars, endpoints, schema, deployment |
| [**backend/README.md**](backend/README.md) | Server-specific setup, troubleshooting |
| [**frontend/README.md**](frontend/README.md) | Client-specific setup, components, troubleshooting |
| [**extension/README.md**](extension/README.md) | Chrome extension setup, OAuth config |

## How it's built

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Server** | FastAPI, Python 3.9+, Pydantic |
| **AI** | Google Gemini AI (gemini-3.0-flash) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + Google OAuth |
| **PDF Generation** | WeasyPrint, Markdown2 |
| **Extension** | Chrome Manifest V3 |
| **Calendar** | Google Calendar API |

---

Built with and love, 🐱GPT and Redbull
