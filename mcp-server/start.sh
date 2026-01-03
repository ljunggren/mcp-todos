#!/bin/bash
PORT=3000
PID_FILE="server.pid"
LOG_FILE="server.log"

if [ -f $PID_FILE ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null; then
        echo "Server is already running (PID: $PID)"
        exit 1
    fi
    rm $PID_FILE
fi

# Check if port is in use
PORT_PID=$(lsof -t -i:$PORT)
if [ ! -z "$PORT_PID" ]; then
    echo "Port $PORT is already in use by PID $PORT_PID. Please stop it first."
    exit 1
fi

echo "Starting MCP server on port $PORT..."
nohup npm start > $LOG_FILE 2>&1 &
echo $! > $PID_FILE
echo "Server started (PID: $(cat $PID_FILE)). Logs: $LOG_FILE"
