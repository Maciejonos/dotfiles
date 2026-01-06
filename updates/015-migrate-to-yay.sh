#!/bin/bash

DOTFILES_DIR="$HOME/.local/share/dotfiles"

if [ -f "$DOTFILES_DIR/bin/lib/helpers.sh" ]; then
	source "$DOTFILES_DIR/bin/lib/helpers.sh"
else
	log_info() { echo "[INFO] $*"; }
	log_success() { echo "[SUCCESS] $*"; }
	log_detail() { echo "  - $*"; }
	log_error() { echo "[ERROR] $*" >&2; }
	ask_yes_no() {
		read -p "$1 [y/N] " -n 1 -r
		echo
		[[ $REPLY =~ ^[Yy]$ ]]
	}
fi

if command -v yay &>/dev/null; then
	log_info "yay is already installed"
else
	log_info "Installing yay AUR helper..."

	if ! pacman -Qi base-devel &>/dev/null; then
		sudo pacman --noconfirm -S base-devel
	fi
	if ! pacman -Qi git &>/dev/null; then
		sudo pacman --noconfirm -S git
	fi

	rm -rf /tmp/yay
	git clone https://aur.archlinux.org/yay.git /tmp/yay
	cd /tmp/yay
	makepkg -si --noconfirm
	cd ~
	rm -rf /tmp/yay

	if command -v yay &>/dev/null; then
		log_success "yay installed successfully"
	else
		log_error "Failed to install yay"
		exit 1
	fi
fi

if command -v paru &>/dev/null; then
	if ask_yes_no "Remove paru? (yay is now the default AUR helper)"; then
		if sudo pacman -Rns paru --noconfirm 2>/dev/null; then
			log_success "paru removed"
		else
			log_detail "Could not remove paru automatically"
			log_detail "Run manually: sudo pacman -Rns paru"
		fi
	else
		log_detail "Keeping paru installed"
	fi
fi
