#!/bin/bash

SERVICE="waybar.service"

if systemctl --user is-active --quiet "$SERVICE" 2>/dev/null; then
  echo "  - $SERVICE already running, skipping"
  exit 0
fi

if systemctl --user enable --now "$SERVICE" &>/dev/null; then
  echo "  - $SERVICE enabled and started"
else
  echo "  - $SERVICE failed to enable/start"
fi
