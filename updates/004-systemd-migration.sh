#!/bin/bash

set -e

DOTFILES_DIR="$HOME/.local/share/dotfiles"

if [ -f "$DOTFILES_DIR/bin/lib/helpers.sh" ]; then
  source "$DOTFILES_DIR/bin/lib/helpers.sh"
else
  log_info() { echo "[INFO] $*"; }
  log_success() { echo "[SUCCESS] $*"; }
  log_detail() { echo "  - $*"; }
  log_error() { echo "[ERROR] $*" >&2; }
fi

log_info "Removing old/conflicting packages..."

OLD_PACKAGES=(
  "hyprland-qt-support"
  "hyprland-qtutils"
  "hyprshot"
  "hyprsunset"
  "matugen-bin"
  "waypaper"
  "python-pywal16"
  "wget"
)

for pkg in "${OLD_PACKAGES[@]}"; do
  if pacman -Qi "$pkg" &>/dev/null; then
    if sudo pacman -Rns "$pkg" --noconfirm 2>/dev/null; then
      log_detail "$pkg removed"
    else
      log_detail "$pkg (failed to remove, may have dependencies)"
    fi
  fi
done

log_info "Installing new packages..."

NEW_PACKAGES=(
  "hyprgraphics"
  "hyprland-guiutils"
  "hyprlang"
  "hyprtoolkit"
  "hyprutils"
  "hyprwayland-scanner"
  "sunsetr"
  "tinte"
  "matugen"
  "grim"
  "slurp"
  "tesseract"
  "tesseract-data-eng"
)

for pkg in "${NEW_PACKAGES[@]}"; do
  if ! pacman -Qi "$pkg" &>/dev/null; then
    if sudo pacman -S "$pkg" --noconfirm --needed 2>/dev/null || paru -S "$pkg" --noconfirm --needed 2>/dev/null; then
      log_detail "$pkg installed"
    else
      log_error "Failed to install $pkg"
    fi
  fi
done

log_info "Migrating to systemd user services..."

pkill -x mako 2>/dev/null || true
pkill -x hyprsunset 2>/dev/null || true
pkill -x hypridle 2>/dev/null || true
pkill -x waybar 2>/dev/null || true
pkill -x swayosd-server 2>/dev/null || true
pkill -x walker 2>/dev/null || true
pkill -x elephant 2>/dev/null || true
pkill -x hyprpaper 2>/dev/null || true
sleep 1

mkdir -p "$HOME/.config/systemd/user"
if [ -d "$DOTFILES_DIR/default/systemd/user" ]; then
  cp -f "$DOTFILES_DIR/default/systemd/user/"*.service "$HOME/.config/systemd/user/" 2>/dev/null || true
  log_detail "Service files copied"
fi

set +e
systemctl --user daemon-reload 2>/dev/null || log_error "Failed to reload systemd"
set -e

log_info "Enabling and starting user services..."
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
set +e
for service in "${USER_SERVICES[@]}"; do
  if systemctl --user enable --now "$service" 2>/dev/null; then
    log_detail "$service enabled and started"
  else
    log_detail "$service (not available or already enabled)"
  fi
done
set -e

[ -d "$HOME/.config/wal/templates" ] && rm -rf "$HOME/.config/wal/templates"
[ -d "$HOME/.config/waypaper" ] && rm -rf "$HOME/.config/waypaper"
[ -f "$HOME/.config/hypr/hyprsunset.conf" ] && rm -f "$HOME/.config/hypr/hyprsunset.conf"

log_info "Removing old placeholder themes..."
[ -d "$DOTFILES_DIR/themes/pywal" ] && rm -rf "$DOTFILES_DIR/themes/pywal" && log_detail "Removed pywal placeholder"
[ -d "$DOTFILES_DIR/themes/matugen" ] && rm -rf "$DOTFILES_DIR/themes/matugen" && log_detail "Removed matugen placeholder"

log_info "Setting default theme..."
if command -v theme-set &>/dev/null; then
  theme-set everforest 2>/dev/null && log_detail "Set theme to everforest"
else
  log_detail "theme-set not found, skipping"
fi

log_info "Setting up wallpapers symlink..."
if [ -d "$DOTFILES_DIR/backgrounds" ]; then
  mkdir -p "$HOME/Pictures"

  if [ -L "$HOME/Pictures/dotfiles-wallpapers" ] || [ -d "$HOME/Pictures/dotfiles-wallpapers" ]; then
    rm -rf "$HOME/Pictures/dotfiles-wallpapers"
  fi

  ln -sf "$DOTFILES_DIR/backgrounds" "$HOME/Pictures/dotfiles-wallpapers"
  log_detail "Wallpapers symlinked to ~/Pictures/dotfiles-wallpapers"
fi

log_info "Reloading Hyprland..."
hyprctl reload 2>/dev/null || log_detail "Hyprland not running"

notify-send -t 10000 "Lots of updates. Check release notes. You may need to restart." 2>/dev/null || true
