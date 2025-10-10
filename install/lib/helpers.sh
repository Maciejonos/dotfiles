#!/bin/bash

# Unified logging and UI helpers for dotfiles installation
# Source this file in all install scripts: source "$(dirname "$0")/lib/helpers.sh"

# Colors (fallback if gum not available)
_GREEN='\033[0;32m'
_BLUE='\033[0;34m'
_YELLOW='\033[1;33m'
_RED='\033[0;31m'
_CYAN='\033[0;36m'
_NC='\033[0m'

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

# Ensure gum is installed (called early in main install script)
ensure_gum() {
    if ! _has_gum; then
        echo "Installing gum for better UI..."
        sudo pacman -S --noconfirm gum
    fi
}

# Display a large header section
log_header() {
    local text="$1"

    if _has_gum; then
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
    else
        echo -e "\n${_GREEN}════════════════════════════════════════${_NC}"
        echo -e "${_GREEN}  $text${_NC}"
        echo -e "${_GREEN}════════════════════════════════════════${_NC}\n"
    fi
}

# Display a step being performed
log_step() {
    local text="$1"

    if _has_gum; then
        echo
        gum style \
            --foreground 108 \
            --bold \
            "$_ICON_STEP $text"
    else
        echo -e "\n${_GREEN}$_ICON_STEP${_NC} $text"
    fi
}

# Display info message (indented, muted)
log_info() {
    local text="$1"

    if _has_gum; then
        gum style \
            --foreground 246 \
            "  $_ICON_INFO $text"
    else
        echo -e "  ${_YELLOW}$_ICON_INFO${_NC} $text"
    fi
}

# Display success message
log_success() {
    local text="$1"

    if _has_gum; then
        gum style \
            --foreground 108 \
            "  $_ICON_SUCCESS $text"
    else
        echo -e "  ${_GREEN}$_ICON_SUCCESS${_NC} $text"
    fi
}

# Display error message
log_error() {
    local text="$1"

    if _has_gum; then
        gum style \
            --foreground 196 \
            --bold \
            "  $_ICON_ERROR $text"
    else
        echo -e "  ${_RED}$_ICON_ERROR${_NC} $text"
    fi
}

# Display a detail line (for things like package names being installed)
log_detail() {
    local text="$1"

    if _has_gum; then
        gum style \
            --foreground 241 \
            "    $_ICON_ARROW $text"
    else
        echo -e "    ${_CYAN}$_ICON_ARROW${_NC} $text"
    fi
}

# Run a command with a spinner
# Usage: spinner "Installing packages..." command arg1 arg2
spinner() {
    local title="$1"
    shift

    if _has_gum; then
        gum spin \
            --spinner dot \
            --title "$title" \
            --show-error \
            -- "$@"
    else
        echo -e "${_CYAN}⟳${_NC} $title"
        "$@"
    fi
}

# Ask yes/no question
ask_yes_no() {
    local prompt="$1"

    if _has_gum; then
        gum confirm "$prompt" && return 0 || return 1
    else
        while true; do
            read -p "$prompt [y/n]: " yn
            case $yn in
                [Yy]* ) return 0;;
                [Nn]* ) return 1;;
                * ) echo "Please answer yes or no.";;
            esac
        done
    fi
}

# Progress indicator for loops
# Usage: log_progress "Installing package" "3/10"
log_progress() {
    local text="$1"
    local count="$2"

    if _has_gum; then
        gum style \
            --foreground 108 \
            "  [$count] $text"
    else
        echo -e "  ${_CYAN}[$count]${_NC} $text"
    fi
}
