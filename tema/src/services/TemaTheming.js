import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {ColorUtils} from '../utils/ColorUtils.js';

const PYWAL_COLORS_PATH = GLib.get_home_dir() + '/.cache/wal/colors';
const PYWAL_ACCENT_COLOR_INDEX = 2;
const DEFAULT_DARK_BACKGROUND = 'rgba(10, 10, 20, 0.95)';
const DEFAULT_LIGHT_BACKGROUND = 'rgba(245, 245, 250, 0.95)';
const DEFAULT_ACCENT_COLOR = '#7aa2f7';

export class TemaTheming {
    constructor() {
        this.dynamicCssProvider = new Gtk.CssProvider();
        this._setupColorSchemeMonitor();
    }

    _setupColorSchemeMonitor() {
        try {
            const settings = new Gio.Settings({
                schema: 'org.gnome.desktop.interface',
            });
            settings.connect('changed::color-scheme', () => {
                print('Color scheme changed, reapplying theming...');
                this.applyDynamicTheming();
            });
        } catch (error) {
            print('Could not setup color scheme monitor:', error.message);
        }
    }

    getSystemColorScheme() {
        try {
            const [success, stdout] = GLib.spawn_command_line_sync(
                'gsettings get org.gnome.desktop.interface color-scheme'
            );
            if (!success) {
                return true;
            }

            const output = new TextDecoder()
                .decode(stdout)
                .trim()
                .replace(/'/g, '');
            return output === 'prefer-dark';
        } catch (error) {
            print('Could not detect color scheme:', error.message);
            return true;
        }
    }

    getPywalBackgroundColor() {
        const colors = this._readPywalColors();
        return colors.length > 0 ? colors[0] : null;
    }

    getPywalAccentColor() {
        const colors = this._readPywalColors();
        return colors.length > PYWAL_ACCENT_COLOR_INDEX
            ? colors[PYWAL_ACCENT_COLOR_INDEX]
            : null;
    }

    _readPywalColors() {
        const file = Gio.File.new_for_path(PYWAL_COLORS_PATH);
        if (!file.query_exists(null)) {
            return [];
        }

        try {
            const [success, contents] = file.load_contents(null);
            if (!success) {
                return [];
            }

            const text = new TextDecoder().decode(contents);
            return text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && line.startsWith('#'));
        } catch (error) {
            print('Could not read pywal colors:', error.message);
            return [];
        }
    }

    hexToRgba(hex, alpha = 0.95) {
        return ColorUtils.hexToRgba(hex, alpha);
    }

    generateDynamicCSS(isDark) {
        const backgroundColor = this._getBackgroundColor(isDark);
        const accentColor = this._getAccentColor();
        const boxShadow = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';

        return `
/* Main window background */
window {
    background-color: ${backgroundColor};
    box-shadow: 0 4px 20px ${boxShadow};
}

@define-color accent_color ${accentColor};
`;
    }

    _getBackgroundColor(isDark) {
        const pywalBg = this.getPywalBackgroundColor();

        if (pywalBg) {
            const backgroundColor = this.hexToRgba(pywalBg, 0.95);
            print(
                'Using pywal background color:',
                pywalBg,
                '->',
                backgroundColor
            );
            return backgroundColor;
        }

        const fallbackColor = isDark
            ? DEFAULT_DARK_BACKGROUND
            : DEFAULT_LIGHT_BACKGROUND;
        print('Pywal color not found, using fallback:', fallbackColor);
        return fallbackColor;
    }

    _getAccentColor() {
        const pywalAccent = this.getPywalAccentColor();

        if (pywalAccent) {
            print('Using pywal accent color (color2):', pywalAccent);
            return pywalAccent;
        }

        print(
            'Pywal accent color not found, using fallback:',
            DEFAULT_ACCENT_COLOR
        );
        return DEFAULT_ACCENT_COLOR;
    }

    applyDynamicTheming(forceDark = null) {
        const isDark =
            forceDark !== null ? forceDark : this.getSystemColorScheme();

        try {
            const css = this.generateDynamicCSS(isDark);
            this.dynamicCssProvider.load_from_string(css);
            Gtk.StyleContext.add_provider_for_display(
                Gdk.Display.get_default(),
                this.dynamicCssProvider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1
            );
            const mode = isDark ? 'dark' : 'light';
            print(`✓ Dynamic theming applied (${mode} mode)`);
        } catch (error) {
            print('Error applying dynamic theming:', error.message);
        }
    }
}
