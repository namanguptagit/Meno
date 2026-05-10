#!/bin/bash
# Keeps Mac awake while docker compose is running
# Usage: ./keep-awake.sh

# Get the PID of docker compose
COMPOSE_PID=$(pgrep -f "docker compose")

if [ -z "$COMPOSE_PID" ]; then
  echo "Docker Compose is not running. Start it first with: docker compose up"
  exit 1
fi

echo "Keeping Mac awake while Docker Compose runs (PID: $COMPOSE_PID)"
echo "Press Ctrl+C or close this terminal to stop"
caffeinate -i -w $COMPOSE_PID
