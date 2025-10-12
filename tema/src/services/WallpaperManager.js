import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';

import {SubprocessUtils} from '../utils/SubprocessUtils.js';

const WAL_PATHS = [
    'wal',
    '/usr/bin/wal',
    '/usr/local/bin/wal',
    GLib.get_home_dir() + '/.local/bin/wal',
    '/bin/wal',
];

export class WallpaperManager {
    constructor(app) {
        this.app = app;
    }

    setWallpaper(imagePath, fileName, lightMode) {
        const walPath = this.findWalExecutable();
        if (!walPath) {
            this._showWalNotFoundError();
            return;
        }

        const spinnerDialog = this._createSpinnerDialog();
        this._executeWal(
            walPath,
            imagePath,
            lightMode,
            spinnerDialog,
            fileName
        );
    }

    findWalExecutable() {
        return SubprocessUtils.findExecutable('wal', WAL_PATHS);
    }

    _showWalNotFoundError() {
        const errorMessage = `Error: wal not found. Please install pywal.\nChecked paths: ${WAL_PATHS.join(', ')}`;
        this.app.showError(errorMessage);
    }

    _executeWal(walPath, imagePath, lightMode, spinnerDialog, fileName) {
        const walArgs = this._buildWalArgs(walPath, imagePath, lightMode);
        const launcher = this._createSubprocessLauncher();
        const walProcess = launcher.spawnv(walArgs);

        walProcess.communicate_utf8_async(null, null, (source, result) => {
            this._handleWalCompletion(
                walProcess,
                result,
                spinnerDialog,
                fileName,
                lightMode
            );
        });
    }

    _buildWalArgs(walPath, imagePath, lightMode) {
        const baseArgs = [walPath, '-n', '-s', '-t', '-e', '-i', imagePath];
        if (lightMode) {
            baseArgs.splice(5, 0, '-l');
        }
        return baseArgs;
    }

    _createSubprocessLauncher() {
        return SubprocessUtils.createSubprocessLauncher();
    }

    _handleWalCompletion(
        walProcess,
        result,
        spinnerDialog,
        fileName,
        lightMode
    ) {
        try {
            const [, , walStderr] = walProcess.communicate_utf8_finish(result);
            spinnerDialog.destroy();

            if (walProcess.get_successful()) {
                this._onWalSuccess(fileName, lightMode);
            } else {
                this.app.showError(`Error running wal: ${walStderr}`);
            }
        } catch (error) {
            spinnerDialog.destroy();
            this.app.showError(`Error: ${error.message}`);
        }
    }

    _onWalSuccess(fileName, lightMode) {
        const mode = lightMode ? 'light' : 'dark';
        print(`Wallpaper and colors set using wal (${mode} mode): ${fileName}`);
        this.app.themeGenerator.generateTemplates();
    }

    _createSpinnerDialog() {
        const dialog = new Adw.MessageDialog({
            transient_for: this.app.get_active_window(),
            modal: true,
            heading: 'Processing...',
            body: 'Generating colors with pywal...',
        });

        const spinner = new Gtk.Spinner({
            spinning: true,
            width_request: 32,
            height_request: 32,
            margin_top: 12,
            margin_bottom: 12,
        });

        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
        });
        box.append(spinner);
        dialog.set_extra_child(box);

        dialog.present();
        return dialog;
    }

    restartSwaybg(backgroundLink) {
        if (!this._isSwaybgRunning()) {
            return;
        }

        this._killSwaybg();
        this._startSwaybg(backgroundLink);
        print('✓ Restarted swaybg with new background');
    }

    _isSwaybgRunning() {
        try {
            const checkProcess = new Gio.Subprocess({
                argv: ['pgrep', '-x', 'swaybg'],
                flags: Gio.SubprocessFlags.STDOUT_PIPE,
            });
            checkProcess.init(null);
            const [, stdout] = checkProcess.communicate_utf8(null, null);

            return checkProcess.get_successful() && stdout.trim();
        } catch (error) {
            print('Error checking swaybg status:', error.message);
            return false;
        }
    }

    _killSwaybg() {
        try {
            const killProcess = new Gio.Subprocess({
                argv: ['pkill', '-x', 'swaybg'],
                flags: Gio.SubprocessFlags.NONE,
            });
            killProcess.init(null);
            killProcess.wait(null);
        } catch (error) {
            print('Error killing swaybg:', error.message);
        }
    }

    _startSwaybg(backgroundLink) {
        try {
            const startArgs = this._buildSwaybgArgs(backgroundLink);
            const startProcess = new Gio.Subprocess({
                argv: startArgs,
                flags: Gio.SubprocessFlags.NONE,
            });
            startProcess.init(null);
        } catch (error) {
            print('Error starting swaybg:', error.message);
        }
    }

    _buildSwaybgArgs(backgroundLink) {
        const baseArgs = ['swaybg', '-i', backgroundLink, '-m', 'fill'];

        if (this._isUwsmAvailable()) {
            return ['uwsm', 'app', '--', ...baseArgs];
        }

        return baseArgs;
    }

    _isUwsmAvailable() {
        return SubprocessUtils.checkCommandExists('uwsm');
    }
}
