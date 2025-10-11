#!/bin/bash

# Unified styling helpers for bin scripts
# Source this file: source "$HOME/.config/dotfiles/bin/lib/helpers.sh"

# Icons
_ICON_STEP="▸"
_ICON_INFO="→"
_ICON_SUCCESS="✓"
_ICON_ERROR="✗"
_ICON_ARROW="›"

# Check if gum is available
_has_gum() {
    command -v gum &> /dev/null
}

# Ensure gum is installed
_ensure_gum() {
    if ! _has_gum; then
        echo "Error: gum is required but not installed."
        echo "Install it with: sudo pacman -S gum"
        exit 1
    fi
}

# Call this early to ensure gum is available
_ensure_gum

# Display a large header section (replaces figlet)
log_header() {
    local text="$1"

    echo
    gum style \
        --foreground 108 \
        --border double \
        --border-foreground 108 \
        --padding "0 2" \
        --margin "1 0" \
        --width 50 \
        --align center \
        "$text"
    echo
}

# Display a step being performed
log_step() {
    local text="$1"

    echo
    gum style \
        --foreground 108 \
        --bold \
        "$_ICON_STEP $text"
}

# Display info message (indented, muted)
log_info() {
    local text="$1"

    gum style \
        --foreground 246 \
        "  $_ICON_INFO $text"
}

# Display success message
log_success() {
    local text="$1"

    gum style \
        --foreground 108 \
        "  $_ICON_SUCCESS $text"
}

# Display error message
log_error() {
    local text="$1"

    gum style \
        --foreground 196 \
        --bold \
        "  $_ICON_ERROR $text"
}

# Display a detail line (for things like file paths, package names)
log_detail() {
    local text="$1"

    gum style \
        --foreground 241 \
        "    $_ICON_ARROW $text"
}

# Run a command with a spinner
# Usage: spinner "Installing packages..." command arg1 arg2
spinner() {
    local title="$1"
    shift

    gum spin \
        --spinner dot \
        --title "$title" \
        --show-error \
        -- "$@"
}

# Ask yes/no question
ask_yes_no() {
    local prompt="$1"

    gum confirm "$prompt" && return 0 || return 1
}

# Progress indicator for loops
# Usage: log_progress "Processing item" "3/10"
log_progress() {
    local text="$1"
    local count="$2"

    gum style \
        --foreground 108 \
        "  [$count] $text"
}

# Show done message with spinner (replaces the show-done script)
show_done() {
    echo
    gum spin --spinner "globe" --title "Done! Press any key to close..." -- bash -c 'read -n 1 -s'
}