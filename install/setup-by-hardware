#!/bin/bash

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/backup.sh"
DOTFILES_DIR="$HOME/.local/share/dotfiles"
HYPRLAND_CONF="$HOME/.config/hypr/hyprland.conf"

log_info "Configuring hardware-specific settings..."

# Determine which environment and keybindings to use
if has_nvidia_gpu; then
  ENV_CONF="nvidia-env.conf"
  log_detail "Detected NVIDIA GPU"
else
  ENV_CONF="env.conf"
fi

HARDWARE=$(detect_hardware_type)
if [ "$HARDWARE" = "laptop" ]; then
  spinner "Installing brightnessctl..." paru --noconfirm -S brightnessctl
  KEYBIND_CONF="laptop-keybindings.conf"
  log_detail "Detected laptop hardware"
else
  spinner "Installing ddcutil..." paru --noconfirm -S ddcutil
  KEYBIND_CONF="desktop-keybindings.conf"
  log_detail "Detected desktop hardware"
fi

# Remove any existing env/keybinding lines first
sed -i '/source = .*\/\(nvidia-env\.conf\|env\.conf\)$/d' "$HYPRLAND_CONF"
sed -i '/source = .*\/\(laptop-keybindings\.conf\|desktop-keybindings\.conf\)$/d' "$HYPRLAND_CONF"

# Insert correct ones for current hardware
sed -i "/source = .*autostart\\.conf/a source = ~/.local/share/dotfiles/default/hypr/conf/${ENV_CONF}\\nsource = ~/.local/share/dotfiles/default/hypr/conf/${KEYBIND_CONF}" "$HYPRLAND_CONF"

log_success "Hardware-specific configuration applied"

# Auto-configure monitors if Hyprland is running
if command -v hyprctl &>/dev/null && hyprctl monitors &>/dev/null; then
  log_info "Detecting monitor configuration..."

  MONITORS_CONF="$HOME/.config/hypr/conf/monitors.conf"
  TEMP_CONF=$(mktemp)

  echo "env = GDK_SCALE,1" > "$TEMP_CONF"
  echo "" >> "$TEMP_CONF"

  # Parse hyprctl output and extract highest mode for each monitor
  hyprctl monitors | awk '
    /^Monitor / {
      if (monitor) print "monitor=" monitor "," mode ",auto,1"
      monitor = $2
      gsub(/[()]/, "", monitor)
      mode = ""
      max_refresh = 0
    }
    /availableModes:/ {
      in_modes = 1
      modes_line = $0
      sub(/.*availableModes: /, "", modes_line)

      split(modes_line, modes, " ")
      for (i in modes) {
        if (modes[i] ~ /@/) {
          split(modes[i], parts, "@")
          res = parts[1]
          refresh = parts[2]
          sub(/Hz$/, "", refresh)

          if (refresh + 0 > max_refresh) {
            max_refresh = refresh + 0
            mode = modes[i]
            sub(/Hz$/, "", mode)
          }
        }
      }
    }
    END {
      if (monitor && mode) print "monitor=" monitor "," mode ",auto,1"
    }
  ' >> "$TEMP_CONF"

  # Only update if we got valid output
  if grep -q "^monitor=" "$TEMP_CONF"; then
    mv "$TEMP_CONF" "$MONITORS_CONF"
    log_success "Auto-configured monitor"
  else
    rm -f "$TEMP_CONF"
    log_detail "Could not detect monitor resolution, keeping default config"
  fi
else
  log_detail "Hyprland not running, keeping default monitor config"
fi
