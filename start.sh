#!/bin/bash

# Fake Account Detector - Startup Script
echo "🔍 Starting Fake Account Detection Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the backend server
echo "🚀 Starting backend server on http://localhost:3000"
echo "📊 Frontend available at: file://$(pwd)/../frontend/index.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
