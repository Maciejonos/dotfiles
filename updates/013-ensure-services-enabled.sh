#!/bin/bash

USER_SERVICES=(
  "elephant.service"
  "hypridle.service"
  "mako.service"
  "sunsetr.service"
  "swayosd.service"
  "walker.service"
  "waybar.service"
  "hyprpaper.service"
)

for service in "${USER_SERVICES[@]}"; do
  if systemctl --user is-active --quiet "$service"; then
    echo "  - $service is already active"
  else
    echo "  - Enabling and starting $service..."
    if systemctl --user enable --now "$service" &>/dev/null; then
      echo "    Success: $service enabled and started"
    else
      echo "    Warning: Failed to enable/start $service (may be missing or invalid)"
    fi
  fi
done