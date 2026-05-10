#!/bin/bash

# Start Xvfb (virtual display) on display :99, resolution 1280x720x24, run in background
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

# Start PulseAudio in daemon mode
pulseaudio --daemonize --exit-idle-time=-1
sleep 1

# Load module-null-sink with sink_name=virtual_speaker to create a fake speaker device
pactl load-module module-null-sink sink_name=virtual_speaker

# Set virtual_speaker as the default audio output
pactl set-default-sink virtual_speaker

# Run the bot
python3 bot.py
