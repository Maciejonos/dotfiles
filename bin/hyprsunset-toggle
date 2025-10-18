#!/bin/bash

# Default temperature values
ON_TEMP=3500
OFF_TEMP=6000

# Ensure hyprsunset is running
if ! pgrep -x hyprsunset >/dev/null; then
  setsid uwsm app -- hyprsunset &
  sleep 1 # Give it time to register
fi

# Query the current temperature
CURRENT_TEMP=$(hyprctl hyprsunset temperature 2>/dev/null | grep -oE '[0-9]+')

# Toggle between ON_TEMP and OFF_TEMP
if [[ "$CURRENT_TEMP" == "$OFF_TEMP" ]]; then
  hyprctl hyprsunset temperature "$ON_TEMP"
  notify-send "  Nightlight screen temperature"
else
  hyprctl hyprsunset temperature "$OFF_TEMP"
  notify-send "  Daylight screen temperature"
fi
