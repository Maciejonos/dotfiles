export class ColorUtils {
    static stripHash(hex) {
        return hex.replace('#', '');
    }

    static hexToRgb(hex) {
        const cleanHex = this.stripHash(hex);
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return `${r} ${g} ${b}`;
    }

    static hexToRgba(hex, alpha = 0.95) {
        const cleanHex = this.stripHash(hex);
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    static calculateLuminance(hex) {
        const cleanHex = this.stripHash(hex);
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    /**
     * Converts hex color to RGB object
     * @param {string} hex - Hex color string
     * @returns {Object} RGB object with r, g, b properties (0-255)
     */
    static hexToRgbObject(hex) {
        const cleanHex = this.stripHash(hex);
        return {
            r: parseInt(cleanHex.substring(0, 2), 16),
            g: parseInt(cleanHex.substring(2, 4), 16),
            b: parseInt(cleanHex.substring(4, 6), 16),
        };
    }

    /**
     * Converts RGB to HSL
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {Object} HSL object with h (0-360), s (0-100), l (0-100)
     */
    static rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h,
            s,
            l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }

    /**
     * Maps a hex color to a Yaru icon theme variant based on hue
     * @param {string} hexColor - Hex color string
     * @returns {string} Yaru theme name (e.g., "Yaru-blue")
     */
    static hexToYaruTheme(hexColor) {
        const rgb = this.hexToRgbObject(hexColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const hue = hsl.h;

        // Map hue ranges to Yaru icon theme variants
        // Red: 345-15°
        if (hue >= 345 || hue < 15) {
            return 'Yaru-red';
        }
        // Warty Brown (orange-brown): 15-30°
        else if (hue >= 15 && hue < 30) {
            return 'Yaru-wartybrown';
        }
        // Yellow: 30-60°
        else if (hue >= 30 && hue < 60) {
            return 'Yaru-yellow';
        }
        // Olive (yellow-green): 60-90°
        else if (hue >= 60 && hue < 90) {
            return 'Yaru-olive';
        }
        // Sage (green): 90-165°
        else if (hue >= 90 && hue < 165) {
            return 'Yaru-sage';
        }
        // Prussian Green (dark teal): 165-195°
        else if (hue >= 165 && hue < 195) {
            return 'Yaru-prussiangreen';
        }
        // Blue: 195-255°
        else if (hue >= 195 && hue < 255) {
            return 'Yaru-blue';
        }
        // Purple: 255-285°
        else if (hue >= 255 && hue < 285) {
            return 'Yaru-purple';
        }
        // Magenta (purple-pink): 285-345°
        else {
            return 'Yaru-magenta';
        }
    }
}
