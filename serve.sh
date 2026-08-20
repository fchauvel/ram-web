#!/bin/bash
# Simple HTTP server for local development

PORT=8000

echo "Starting HTTP server on http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "Error: Python is not installed"
    exit 1
fi
