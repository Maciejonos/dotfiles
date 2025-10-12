import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';

const VIM_KEY_MAP = {
    104: Gtk.DirectionType.LEFT, // h
    106: Gtk.DirectionType.DOWN, // j
    107: Gtk.DirectionType.UP, // k
    108: Gtk.DirectionType.RIGHT, // l
};

export class DialogManager {
    constructor(app) {
        this.app = app;
    }

    addVimKeybindings(dialog) {
        const keyController = new Gtk.EventControllerKey();
        dialog.add_controller(keyController);

        keyController.connect('key-pressed', (controller, keyval) => {
            return this._handleVimKey(dialog, keyval);
        });
    }

    _handleVimKey(dialog, keyval) {
        const direction = VIM_KEY_MAP[keyval];

        if (direction === undefined) {
            return false;
        }

        dialog.child_focus(direction);
        return true;
    }

    showHelpModal(parent) {
        const dialog = new Adw.MessageDialog({
            transient_for: parent,
            modal: true,
            heading: 'Keyboard Shortcuts',
        });

        const label = new Gtk.Label({
            label: `Navigation
Arrow Keys - Navigate through wallpapers
h j k l - Vim-style navigation
Tab - Move focus between elements
Enter - Set selected wallpaper

Actions
e - Eject theme from wallpaper
? - Show this help dialog
q / Esc - Quit application`,
            xalign: 0,
            margin_start: 12,
            margin_end: 12,
            margin_top: 12,
            margin_bottom: 12,
        });

        dialog.set_extra_child(label);
        dialog.add_response('ok', 'Got it!');
        dialog.set_default_response('ok');
        dialog.set_close_response('ok');

        dialog.connect('response', () => dialog.destroy());
        dialog.present();
    }

    showModeDialog(parent, filePath, fileName, callback) {
        const dialog = new Adw.MessageDialog({
            transient_for: parent,
            modal: true,
            heading: 'Choose Theme Mode',
        });

        dialog.add_response('dark', 'Dark Mode');
        dialog.add_response('light', 'Light Mode');
        dialog.add_response('cancel', 'Cancel');

        dialog.set_response_appearance(
            'dark',
            Adw.ResponseAppearance.SUGGESTED
        );
        dialog.set_default_response('dark');
        dialog.set_close_response('cancel');

        this.addVimKeybindings(dialog);

        dialog.connect('response', (dialog, response) => {
            if (response === 'dark' || response === 'light') {
                callback(filePath, fileName, response === 'light');
            }
            dialog.destroy();
        });

        dialog.present();
    }

    showError(message, parent = null) {
        print(`Error: ${message}`);
        this._showMessageDialog('Error', message, parent);
    }

    showSuccess(message, parent = null) {
        print(`Success: ${message}`);
        this._showMessageDialog('Success', message, parent);
    }

    _showMessageDialog(heading, message, parent = null) {
        const window = parent || this.app.get_active_window();

        if (!window) {
            return;
        }

        const dialog = new Adw.MessageDialog({
            transient_for: window,
            modal: true,
            heading: heading,
            body: message,
        });

        dialog.add_response('ok', 'OK');
        dialog.set_default_response('ok');
        dialog.connect('response', () => dialog.destroy());
        dialog.present();
    }

    showThemeEjectionDialog(parent, filePath, fileName, callback) {
        const dialog = this._createThemeEjectionDialog(parent, fileName);

        dialog.connect('response', (dialog, response) => {
            this._handleThemeEjectionResponse(
                dialog,
                response,
                parent,
                filePath,
                fileName,
                callback
            );
        });

        dialog.present();
    }

    _createThemeEjectionDialog(parent, fileName) {
        const dialog = new Adw.MessageDialog({
            transient_for: parent,
            modal: true,
            heading: 'Eject Theme',
            body: `Create theme from: ${fileName}`,
        });

        dialog.add_response('dark', 'Dark Mode');
        dialog.add_response('light', 'Light Mode');
        dialog.add_response('cancel', 'Cancel');

        dialog.set_response_appearance(
            'dark',
            Adw.ResponseAppearance.SUGGESTED
        );
        dialog.set_default_response('dark');
        dialog.set_close_response('cancel');

        this.addVimKeybindings(dialog);

        return dialog;
    }

    _handleThemeEjectionResponse(
        dialog,
        response,
        parent,
        filePath,
        fileName,
        callback
    ) {
        if (response !== 'dark' && response !== 'light') {
            dialog.destroy();
            return;
        }

        const isLight = response === 'light';
        dialog.destroy();
        this._showPathSelectionDialog(
            parent,
            filePath,
            fileName,
            isLight,
            callback
        );
    }

    _showPathSelectionDialog(parent, filePath, fileName, isLight, callback) {
        const defaultPath = this._getDefaultThemePath(fileName);

        const dialog = new Adw.MessageDialog({
            transient_for: parent,
            modal: true,
            heading: 'Select Output Path',
            body: 'Enter the path where the theme should be created:',
        });

        const entry = this._createPathEntry(defaultPath);
        const box = this._createEntryContainer(entry);
        dialog.set_extra_child(box);

        this._configurePathDialogResponses(dialog);

        dialog.connect('response', (dialog, response) => {
            this._handlePathSelectionResponse(
                dialog,
                response,
                entry,
                filePath,
                fileName,
                isLight,
                callback
            );
        });

        dialog.present();
        entry.grab_focus();
    }

    _getDefaultThemePath(fileName) {
        const homeDir = GLib.get_home_dir();
        const themeName = fileName.replace(/\.[^.]+$/, '');
        return `${homeDir}/omarchy-${themeName}-theme`;
    }

    _createPathEntry(defaultPath) {
        return new Gtk.Entry({
            text: defaultPath,
            hexpand: true,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
        });
    }

    _createEntryContainer(entry) {
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
        });
        box.append(entry);
        return box;
    }

    _configurePathDialogResponses(dialog) {
        dialog.add_response('create', 'Create Theme');
        dialog.add_response('cancel', 'Cancel');
        dialog.set_response_appearance(
            'create',
            Adw.ResponseAppearance.SUGGESTED
        );
        dialog.set_default_response('create');
        dialog.set_close_response('cancel');
    }

    _handlePathSelectionResponse(
        dialog,
        response,
        entry,
        filePath,
        fileName,
        isLight,
        callback
    ) {
        if (response === 'create') {
            const outputPath = entry.get_text();
            callback(filePath, fileName, isLight, outputPath);
        }
        dialog.destroy();
    }
}
