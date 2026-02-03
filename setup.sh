#!/bin/bash

echo "🐱 Syllabus Kitty - Setup Script"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================
# CLEANUP
# ============================================
echo "🔪 Cleaning up existing processes..."
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "python main.py" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "node.*next" 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
print_status "Cleaned up existing processes"
echo ""

# ============================================
# PREREQUISITES CHECK
# ============================================
echo "🔍 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
print_status "Python $PYTHON_VERSION found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi
NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi
print_status "npm found"
echo ""

# ============================================
# SYSTEM DEPENDENCIES (macOS)
# ============================================
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - Installing system dependencies..."
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. WeasyPrint may not work for PDF generation."
        print_info "Install Homebrew from: https://brew.sh"
    else
        echo "   Installing libraries for PDF generation (WeasyPrint)..."
        brew install pango gdk-pixbuf libffi 2>/dev/null || print_status "System libraries already installed"
        print_status "System dependencies ready"
    fi
    echo ""
fi

# ============================================
# BACKEND SETUP
# ============================================
echo "📦 Setting up Backend..."
echo "   See backend/README.md for full documentation"
cd "$SCRIPT_DIR/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "   Installing Python dependencies..."
pip install -r requirements.txt --quiet
print_status "Backend dependencies installed"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.local" ]; then
        cp .env.local .env
        print_warning "Created backend/.env from .env.local - Please add your API keys!"
    else
        cat > .env << 'EOF'
# Backend Environment Variables
# See backend/README.md for full documentation

# Required
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional - Server Config
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional - Gemini Config
GEMINI_MODEL_ID=gemini-3.0-flash
EOF
        print_warning "Created backend/.env template - Please add your API keys!"
    fi
else
    print_status "backend/.env already exists"
fi

cd "$SCRIPT_DIR"
echo ""

# ============================================
# FRONTEND SETUP
# ============================================
echo "📦 Setting up Frontend..."
echo "   See frontend/README.md for full documentation"
cd "$SCRIPT_DIR/frontend"

# Install dependencies
echo "   Installing npm dependencies..."
npm install --silent 2>/dev/null
print_status "Frontend dependencies installed"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Frontend Environment Variables
# See frontend/README.md for full documentation

# Supabase - Get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
    print_warning "Created frontend/.env.local template - Please add your Supabase credentials!"
else
    print_status "frontend/.env.local already exists"
fi

cd "$SCRIPT_DIR"
echo ""

# ============================================
# EXTENSION INFO
# ============================================
echo "🧩 Extension Setup..."
echo "   See extension/README.md for full documentation"
echo ""
print_info "The Chrome extension requires manual loading:"
echo "   1. Open chrome://extensions/ in Chrome"
echo "   2. Enable 'Developer mode' (toggle in top right)"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the 'extension' folder from this project"
echo ""
print_info "For Google Calendar integration, you'll need to:"
echo "   1. Create OAuth credentials in Google Cloud Console"
echo "   2. Update extension/manifest.json with your client ID"
echo "   See extension/README.md for detailed instructions"
echo ""

# ============================================
# SUMMARY
# ============================================
echo "============================================="
echo "🎉 Setup complete!"
echo "============================================="
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Configure your environment variables${NC}"
echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ BACKEND (backend/.env)                                      │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│ 1. Get Gemini API key:                                      │"
echo "│    https://makersuite.google.com/app/apikey                 │"
echo "│                                                             │"
echo "│ 2. Get Supabase credentials:                                │"
echo "│    https://supabase.com → Your Project → Settings → API    │"
echo "│    - SUPABASE_URL (Project URL)                             │"
echo "│    - SUPABASE_SERVICE_ROLE_KEY (service_role key)           │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ FRONTEND (frontend/.env.local)                              │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│ Get from Supabase Dashboard → Settings → API:               │"
echo "│ - NEXT_PUBLIC_SUPABASE_URL (Project URL)                    │"
echo "│ - NEXT_PUBLIC_SUPABASE_ANON_KEY (anon/public key)           │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ 🚀 START THE APP                                            │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│ Terminal 1 (Backend):                                       │"
echo "│   cd backend && source venv/bin/activate && python main.py  │"
echo "│                                                             │"
echo "│   macOS PDF issues? Run with:                               │"
echo "│   DYLD_LIBRARY_PATH=/opt/homebrew/lib python main.py        │"
echo "│                                                             │"
echo "│ Terminal 2 (Frontend):                                      │"
echo "│   cd frontend && npm run dev                                │"
echo "│                                                             │"
echo "│ Then open: http://localhost:3000                            │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
echo "🐱 Happy coding!"
