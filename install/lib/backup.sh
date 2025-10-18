#!/bin/bash

BACKUP_ROOT="$HOME/dotfiles-backup"
SESSION_FILE="$HOME/.local/share/dotfiles/.dotfiles-backup-session"

# Initialize a new backup session (call once in main install script)
init_backup_session() {
  local BACKUP_SESSION="backup_$(date +%Y%m%d_%H%M%S)"
  local BACKUP_DIR="$BACKUP_ROOT/$BACKUP_SESSION"
  local RESTORE_FILE="$BACKUP_DIR/RESTORE.txt"

  mkdir -p "$BACKUP_DIR"

  # Write session info to file so all scripts can access it
  cat > "$SESSION_FILE" <<EOF
BACKUP_SESSION="$BACKUP_SESSION"
BACKUP_DIR="$BACKUP_DIR"
RESTORE_FILE="$RESTORE_FILE"
EOF

  cat > "$RESTORE_FILE" <<EOF
Backup created: $(date '+%Y-%m-%d %H:%M:%S')
Source: dotfiles installation

Files backed up:
EOF

  # Copy rollback script to backup directory
  local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ -f "$SCRIPT_DIR/rollback.sh" ]; then
    cp "$SCRIPT_DIR/rollback.sh" "$BACKUP_DIR/rollback.sh"
    chmod +x "$BACKUP_DIR/rollback.sh"
  fi

  echo "$BACKUP_SESSION"
}

# Backup a file or directory
backup_file() {
  local source_path="$1"

  # Load session from file if not in environment
  if [ -z "$BACKUP_DIR" ]; then
    if [ ! -f "$SESSION_FILE" ]; then
      echo "ERROR: No backup session initialized" >&2
      return 1
    fi
    source "$SESSION_FILE"
  fi

  if [ ! -e "$source_path" ]; then
    return 1
  fi

  # Create mirror structure
  local rel_path="${source_path#/}"  # Remove leading /
  local backup_path="$BACKUP_DIR/$rel_path"
  local backup_parent="$(dirname "$backup_path")"

  mkdir -p "$backup_parent" || {
    echo "ERROR: Failed to create backup directory: $backup_parent" >&2
    return 1
  }

  # Use sudo if backing up system files
  if [[ "$source_path" =~ ^"$HOME" ]]; then
    cp -rP "$source_path" "$backup_path" || {
      echo "ERROR: Failed to backup: $source_path" >&2
      return 1
    }
  else
    sudo cp -rP "$source_path" "$backup_path" || {
      echo "ERROR: Failed to backup: $source_path" >&2
      return 1
    }
  fi

  # Generate restore command
  local restore_cmd
  if [ -d "$source_path" ]; then
    restore_cmd="cp -r $BACKUP_DIR/$rel_path $(dirname "$source_path")/"
  else
    restore_cmd="cp $BACKUP_DIR/$rel_path $source_path"
  fi

  # Add sudo if needed
  if [[ ! "$source_path" =~ ^"$HOME" ]]; then
    restore_cmd="sudo $restore_cmd"
  fi

  cat >> "$RESTORE_FILE" <<EOF

- $source_path
  Restore: $restore_cmd
EOF

  return 0
}
