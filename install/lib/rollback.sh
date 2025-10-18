#!/bin/bash

# Rollback script - restores files from a backup session
# Usage: ./rollback.sh [backup_dir]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}→${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Determine backup directory
if [ -n "$1" ]; then
  BACKUP_DIR="$1"
else
  # Find most recent backup
  BACKUP_ROOT="$HOME/dotfiles-backup"
  if [ ! -d "$BACKUP_ROOT" ]; then
    log_error "No backups found at $BACKUP_ROOT"
    exit 1
  fi

  BACKUP_DIR=$(ls -1dt "$BACKUP_ROOT"/backup_* 2>/dev/null | head -n1)

  if [ -z "$BACKUP_DIR" ]; then
    log_error "No backup sessions found"
    exit 1
  fi

  log_info "Using most recent backup: $(basename "$BACKUP_DIR")"
fi

RESTORE_FILE="$BACKUP_DIR/RESTORE.txt"

if [ ! -f "$RESTORE_FILE" ]; then
  log_error "RESTORE.txt not found in $BACKUP_DIR"
  exit 1
fi

# Show backup info
log_info "$(grep 'Backup created:' "$RESTORE_FILE")"
echo

# Check if we need sudo for any operations
NEEDS_SUDO=false
while IFS= read -r line; do
  if [[ "$line" =~ ^[[:space:]]*Restore:[[:space:]]sudo ]]; then
    NEEDS_SUDO=true
    break
  fi
done < "$RESTORE_FILE"

# Confirm with user
read -p "Are you sure you want to rollback? This will overwrite current files. [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log_warning "Rollback cancelled"
  exit 0
fi

# Cache sudo credentials if needed
if [ "$NEEDS_SUDO" = true ]; then
  log_info "Some files require sudo access..."
  sudo -v || {
    log_error "Sudo authentication failed"
    exit 1
  }
fi

# Track special files that need post-processing
NEEDS_MKINITCPIO_REGEN=false

# Parse and execute restore commands
log_info "Starting rollback..."
echo

while IFS= read -r line; do
  # Look for restore commands
  if [[ "$line" =~ ^[[:space:]]*Restore:[[:space:]](.+)$ ]]; then
    restore_cmd="${BASH_REMATCH[1]}"

    # Execute the restore command
    log_info "Executing: $restore_cmd"

    if eval "$restore_cmd"; then
      log_success "Restored successfully"

      # Check if we restored mkinitcpio.conf
      if [[ "$restore_cmd" =~ /etc/mkinitcpio\.conf ]]; then
        NEEDS_MKINITCPIO_REGEN=true
      fi
    else
      log_error "Failed to execute: $restore_cmd"
      exit 1
    fi

    echo
  fi
done < "$RESTORE_FILE"

# Post-processing for system files
if [ "$NEEDS_MKINITCPIO_REGEN" = true ]; then
  log_info "Regenerating initramfs (mkinitcpio.conf was restored)..."

  if sudo mkinitcpio -P; then
    log_success "Initramfs regenerated successfully"
    log_warning "System reboot recommended"
  else
    log_error "Failed to regenerate initramfs"
    log_warning "Run 'sudo mkinitcpio -P' manually"
    exit 1
  fi

  echo
fi

log_success "Rollback completed!"
log_info "Original files were at: $BACKUP_DIR"
