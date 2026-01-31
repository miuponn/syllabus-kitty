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
    cp .env.local.example .env.local
    echo "✅ Frontend environment file created"
fi

cd ..
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your Gemini API key to backend/.env"
echo "2. Start the backend: cd backend && source venv/bin/activate && python main.py"
echo "3. In a new terminal, start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🐱 Happy coding!"
