#!/bin/bash
set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source "$SCRIPT_DIR/lib/helpers.sh"
source "$SCRIPT_DIR/lib/backup.sh"

# Install additional NVIDIA packages
log_info "Installing additional NVIDIA packages..."
NVIDIA_PACKAGES=(
    "nvidia-utils"
    "egl-wayland"
    "libva-nvidia-driver"
    "qt5-wayland"
    "qt6-wayland"
)

spinner "Installing NVIDIA packages..." sudo pacman -S --needed --noconfirm "${NVIDIA_PACKAGES[@]}"
log_success "NVIDIA packages installed"

# Configure mkinitcpio for early loading
log_info "Configuring mkinitcpio for NVIDIA early loading..."
MKINITCPIO_CONF="/etc/mkinitcpio.conf"
NVIDIA_MODULES="nvidia nvidia_modeset nvidia_uvm nvidia_drm"

# Backup original config
[ -f "$MKINITCPIO_CONF" ] && backup_file "$MKINITCPIO_CONF"

# Remove any old nvidia modules to prevent duplicates
sudo sed -i -E 's/ nvidia_drm//g; s/ nvidia_uvm//g; s/ nvidia_modeset//g; s/ nvidia//g;' "$MKINITCPIO_CONF"

# Add the new modules at the start of the MODULES array
sudo sed -i -E "s/^(MODULES=\\()/\\1${NVIDIA_MODULES} /" "$MKINITCPIO_CONF"

# Clean up potential double spaces
sudo sed -i -E 's/  +/ /g' "$MKINITCPIO_CONF"

log_success "mkinitcpio.conf updated"

# Regenerate initramfs
log_info "Regenerating initramfs..."
spinner "Regenerating initramfs..." sudo mkinitcpio -P
log_success "Initramfs regenerated"

log_success "NVIDIA configuration complete!"
