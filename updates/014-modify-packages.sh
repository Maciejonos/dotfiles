#!/bin/bash

if ! pacman -Qq matugen &>/dev/null; then
  paru -S matugen --noconfirm 2>/dev/null || true
fi

if ! pacman -Qq gjs &>/dev/null; then
  paru -S gjs --noconfirm 2>/dev/null || true
fi

if ! pacman -Qq tinte &>/dev/null; then
  paru -S tinte --noconfirm 2>/dev/null || true
fi

if ! pacman -Qq gpu-screen-recorder &>/dev/null; then
  paru -S gpu-screen-recorder --noconfirm 2>/dev/null || true
fi

if pacman -Qq kooha &>/dev/null; then
  paru -Rns kooha --noconfirm 2>/dev/null || true
fi

if ! pacman -Qq usbutils &>/dev/null; then
  paru -S usbutils --noconfirm 2>/dev/null || true
fi
