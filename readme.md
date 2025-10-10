# Dotfiles Setup

## Overview
Created a comprehensive dotfiles management system for Arch Linux + Hyprland with automated installation scripts.

## Final Structure
```
~/.config/dotfiles/
├── install/
│   ├── install             # Main installer
│   ├── pkgs.txt            # Package list
│   ├── zsh-plugins         # Oh-my-zsh & plugins
│   ├── symlinks            # Creates all symlinks
│   ├── system-setup        # System configuration
│   └── icons/              # Custom icon themes
├── config/                 # All config files
│   ├── hypr/
│   ├── zshrc/
│   └── [other configs]
├── bin/                    # Custom scripts
├── applications/           # .desktop files
├── themes/                 # Theme configs
└── current/                # Active theme symlinks
```

## Key Features

### 1. Package Management
- **pkgs.txt**: Categorized package list (Security, Dev, Terminal, Hyprland, etc.)
- Excludes base system packages (installed via archinstall)
- Installs paru AUR helper automatically if missing
- Optional packages: ddcutil (desktop), brightnessctl (laptop)

### 2. Profile System - need to be added
- Laptop vs Desktop profiles
- Profile-specific configs for: hypr monitors
- Asks during installation which profile to use
- Shared files linked normally, profile-specific files get special handling

### 3. Symlink Management (symlinks.sh)
- `~/.local/share/applications` → dotfiles/applications
- `~/.local/bin` → dotfiles/bin
- `~/.local/share/icons/*` → dotfiles/install/icons/*
- `~/.zshrc` → dotfiles/config/zshrc/.zshrc
- `~/.config/zshrc` → dotfiles/config/zshrc/
- All dotfiles/config/* → ~/.config/* (with profile handling)

### 4. External Tools
- Installs Oh-My-Zsh (unattended)
- Installs zsh plugins: zsh-autosuggestions, fast-syntax-highlighting
- Removes default .zshrc (replaced by dotfiles symlink)
- Idempotent (checks if already installed)

### 5. System Configuration (configure.sh)
- **gnome-keyring PAM integration**: Modifies /etc/pam.d/login and /etc/pam.d/passwd
- **UFW**: Configures firewall (deny incoming, allow outgoing, open ports for LocalSend + SSH)
- **Default shell**: Changes to /usr/bin/zsh (hardcoded path)

### 6. Theme System
- Initial theme: everforest
- Symlinks theme-specific configs for: neovim, btop, mako, eza
- `dotfiles/themes/[theme-name]` → `dotfiles/current/theme`

## Important Technical Details

### Symlinks
- Use `ln -snf` for replacing existing symlinks

### zsh Path Issue
- zsh exists in both /usr/bin/zsh and /usr/sbin/zsh (hardlinks)
- Hardcode `/usr/bin/zsh` in chsh command (standard location)

### Package List Notes
- Don't include: base, base-devel, linux, linux-firmware, linux-headers
- Don't include: hyprland (from archinstall), pipewire stack, bluez, iwd
- Include: User-installed apps, fonts, themes, dev tools
- Remove: wpa_supplicant, wireless_tools (using iwd)
- Keep xorg packages for compatibility

### Error Handling
- All scripts check if items already exist before installing/linking
- Backups created for PAM files before modification
- Idempotent design (can run multiple times safely)

## Installation Flow
1. Clone dotfiles to ~/.config/dotfiles
2. Run install.sh
3. Installs paru if needed
4. Installs packages from pkgs.txt
5. Asks about optional packages
6. Installs oh-my-zsh & plugins
7. Asks for laptop/desktop profile
8. Creates all symlinks
9. Configures system services
10. Shows completion time
11. Offers to reboot