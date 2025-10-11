# Dotfiles Setup for Hyprland on Arch Linux

### Install with  curl -fsSL https://raw.githubusercontent.com/Maciejonos/dotfiles/master/bootstrap.sh | bash
#### This is meant specifically for Arch Linux with hyprland already installed, and won't work on other systems.

## Features

### Automated Setup
1. Package installation (114 [packages](install/pkgs.txt) from official repos and AUR)
2. Flatpak applications 
3. Hardware detection (NVIDIA GPU, laptop/desktop)
4. System configuration (firewall, PAM, pacman, git, zsh) 

### Configuration Management
5. Directory-level symlinks for instant git sync
6. Machine-specific overrides (monitors, keybindings, environment)
7. Theme switching system with 6 themes [see themes](themes/)
8. Custom utility scripts (28 scripts) [see bin](bin/)

### Shell Setup
9. Oh-my-zsh with plugins (autosuggestions, syntax highlighting)
10. Modular zsh config [see config](config/zshrc/)

### Applications Configured
11. Hyprland with modular config [see hypr](config/hypr/)
12. Waybar, Walker, Mako, GTK, Nautilus, Ghostty, Neovim, and more [see config](config/)

## This is meant for fresh systems, the installation and symlinks will remove existing configs (like .zshrc if it exists).Check this  [here](install/symlinks) and [here](install/install##)
