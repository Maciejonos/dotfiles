#!/bin/bash

set -e

DOTFILES_DIR="$HOME/.local/share/dotfiles"
REPO_URL="https://github.com/Maciejonos/dotfiles.git"

echo "=============="
echo "Dotfiles Setup"
echo "=============="
echo

# Check if dotfiles directory already exists
if [ -d "$DOTFILES_DIR" ]; then
    echo "ERROR: $DOTFILES_DIR already exists!"
    echo "If you want to reinstall, please remove or backup the existing directory first:"
    echo "  mv ~/.local/share/dotfiles ~/.local/share/dotfiles.backup"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Installing git..."
    sudo pacman -S --noconfirm git
    echo "Git installed successfully!"
fi

# Create .config directory if it doesn't exist
mkdir -p "$HOME/.config"

# Create .local/share/dotfiles directory
mkdir -p "$HOME/.local/share/dotfiles"

# Clone the dotfiles repository
echo "Cloning dotfiles repository..."
git clone "$REPO_URL" "$DOTFILES_DIR"

echo
echo "Repository cloned successfully!"
echo "Starting installation..."
echo

# Run the installer
bash "$DOTFILES_DIR/install/install"
