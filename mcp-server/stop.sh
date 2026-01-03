#!/bin/bash
PID_FILE="server.pid"

if [ -f $PID_FILE ]; then
    PID=$(cat $PID_FILE)
    echo "Stopping server (PID: $PID)..."
    kill $PID
    rm $PID_FILE
    echo "Server stopped."
else
    echo "No PID file found. Checking for node process on port 3000..."
    PID=$(lsof -t -i:3000)
    if [ ! -z "$PID" ]; then
        kill $PID
        echo "Killed process $PID on port 3000."
    else
        echo "Server is not running."
    fi
fi
