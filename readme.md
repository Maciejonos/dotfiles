# Dotfiles Setup for Hyprland on Arch Linux

<img width="2561" height="1441" alt="1760196581" src="https://github.com/user-attachments/assets/7e4f6b59-a7cd-4dab-b66b-86d91df011a1" />

## Installation
#### curl-fsSL https://raw.githubusercontent.com/Maciejonos/dotfiles/master/setup.sh | bash
#### This is meant specifically for Arch Linux with hyprland already installed, and won't work on other systems.

## Important note
I've taken a lot of configs (like the full theming system) and scripts from Omarchy, some are modified, some are almost the same, and some I added on my own. By no means am I saying that I created all of this myself.

Omarchy is awesome, but I wanted to have something that I can easily modify myself, on just pure Arch, without installing a whole distro. Either way, if you somehow haven't heard of it, you should check it out! https://omarchy.org/

## Features

### Automated Setup
1. Package installation ([packages](install/pkgs.txt) from official repos and AUR, won't reinstall if already installed)
2. Flatpak applications - for now only Kooha (for screen recording, works the best from what I tested and has a nice UI)
3. Hardware detection (NVIDIA GPU, laptop/desktop)
4. System configuration (firewall, PAM, pacman, git, zsh, ly display manager - if installed)
5. Automatic backups with rollback support - everything changed by the installer script will be neatly backed up to your home directory, including everything in ~/.config, pacman configuration and everything else. You will also have a txt file with a list of things that were changed and commands to easily rollback. On top of that, you can use the rollback script, that will restore everything automatically, to the way it was before the installation.
6. I will add a system for updating configs automatically, but you can just remove the .git folder and move everythig as you wish.

### Configuration Management
7. Config copying with hardware-specific overrides
8. Default configs live in [default/](default/) that update without breaking your changes
9. User configs in [config/](config/) that can be freely modified
10. Theme switching system with 8 themes [see themes](themes/), including 2 dynamic ones, using Matugen and Pywal
11. Custom utility scripts (30 scripts) [see bin](bin/)

### Shell Setup
12. Oh-my-zsh with plugins (autosuggestions, syntax highlighting)
13. Modular zsh config [see config](default/zshrc/), with some nice features

### Applications Configured
14. Full hyprland config, auto detection of monitor (tries to set highest available resolution and refresh rate [see here](install/setup-by-hardware/))
15. Waybar, Walker, Elephant, Mako, GTK, Nautilus, Ghostty, Neovim, and more [see config](config/)
