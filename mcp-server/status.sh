#!/bin/bash
PID_FILE="server.pid"
PORT=3000

if [ -f $PID_FILE ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null; then
        echo "Server is running (PID: $PID) on port $PORT"
        echo "Last 10 lines of log:"
        tail -n 10 server.log
    else
        echo "PID file exists but process is not running."
    fi
else
    PID=$(lsof -t -i:$PORT)
    if [ ! -z "$PID" ]; then
        echo "Server is running on port $PORT (PID: $PID), but no PID file found."
    else
        echo "Server is not running."
    fi
fi
