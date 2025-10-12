import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class SubprocessUtils {
    static isExecutable(path) {
        try {
            const subprocess = new Gio.Subprocess({
                argv: ['test', '-x', path],
                flags: Gio.SubprocessFlags.NONE,
            });
            subprocess.init(null);
            subprocess.wait(null);
            return subprocess.get_successful();
        } catch (error) {
            return false;
        }
    }

    static findExecutable(name, possiblePaths) {
        for (const path of possiblePaths) {
            if (this.isExecutable(path)) {
                return path;
            }
        }
        return null;
    }

    static checkCommandExists(command, callback) {
        try {
            const subprocess = new Gio.Subprocess({
                argv: ['which', command],
                flags: Gio.SubprocessFlags.STDOUT_PIPE,
            });
            subprocess.init(null);

            if (callback) {
                subprocess.communicate_utf8_async(
                    null,
                    null,
                    (source, result) => {
                        try {
                            subprocess.communicate_utf8_finish(result);
                            callback(subprocess.get_successful());
                        } catch (error) {
                            callback(false);
                        }
                    }
                );
            } else {
                subprocess.wait(null);
                return subprocess.get_successful();
            }
        } catch (error) {
            if (callback) {
                callback(false);
            }
            return false;
        }
    }

    static createSubprocessLauncher() {
        const launcher = new Gio.SubprocessLauncher({
            flags:
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE,
        });

        launcher.setenv('HOME', GLib.get_home_dir(), true);

        const currentPath = GLib.getenv('PATH') || '';
        const localBin = GLib.get_home_dir() + '/.local/bin';
        if (!currentPath.includes(localBin)) {
            launcher.setenv('PATH', `${currentPath}:${localBin}`, true);
        }

        return launcher;
    }
}
