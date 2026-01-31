#!/bin/bash

echo "🐱 Setting up Syllabus Kitty..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Python and Node.js found"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY"
fi

cd ..
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend

# Install dependencies
npm install
echo "✅ Frontend dependencies installed"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created frontend/.env.local from template"
else
    echo "✅ frontend/.env.local already exists"
fi

cd ..
echo ""

echo "🎉 Setup complete!"
echo ""
echo "⚠️  IMPORTANT: Configure your environment variables"
echo ""
echo "Backend Setup:"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit backend/.env and add: GEMINI_API_KEY=your_key_here"
echo ""
echo "Frontend Setup:"
echo "1. Create a Supabase project at: https://supabase.com"
echo "2. Go to Project Settings → API in Supabase dashboard"
echo "3. Edit frontend/.env.local and add:"
echo "   - NEXT_PUBLIC_SUPABASE_URL=your_project_url"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo ""
echo "Start the app:"
echo "1. Backend: cd backend && source venv/bin/activate && python main.py"
echo "2. Frontend (new terminal): cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🐱 Happy coding!"
