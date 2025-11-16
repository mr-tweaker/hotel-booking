#!/bin/bash

# Quick run script for BookingHours

echo "🚀 Starting BookingHours..."
echo ""

# Check if Backend dependencies are installed
if [ ! -d "Backend/node_modules" ]; then
    echo "📦 Installing Backend dependencies..."
    cd Backend
    npm install
    cd ..
fi

# Start backend in background
echo "🔧 Starting Backend server on http://localhost:4000..."
cd Backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "🌐 Starting Frontend server on http://localhost:5500..."
    echo ""
    echo "✅ Backend: http://localhost:4000"
    echo "✅ Frontend: http://localhost:5500"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo ""
    
    cd Frontend
    python3 -m http.server 5500
elif command -v python &> /dev/null; then
    echo "🌐 Starting Frontend server on http://localhost:5500..."
    echo ""
    echo "✅ Backend: http://localhost:4000"
    echo "✅ Frontend: http://localhost:5500"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo ""
    
    cd Frontend
    python -m http.server 5500
else
    echo "⚠️  Python not found. Please start frontend manually:"
    echo "   cd Frontend"
    echo "   python3 -m http.server 5500"
    echo ""
    echo "Backend is running. Press Ctrl+C to stop it."
    wait $BACKEND_PID
fi

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

