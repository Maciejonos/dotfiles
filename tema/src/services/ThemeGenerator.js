import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {SubprocessUtils} from '../utils/SubprocessUtils.js';
import {ColorUtils} from '../utils/ColorUtils.js';

const IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.tiff',
];
const LUMINANCE_LIGHT_THRESHOLD = 0.5;

export class ThemeGenerator {
    constructor(app) {
        this.app = app;
    }

    generateTemplates() {
        print('Generating templates with pywal colors...');

        const colors = this.readPywalColors();
        if (!colors) {
            print('Error: Could not read pywal colors');
            return;
        }

        const templatesDir = this.findTemplatesDirectory();
        if (!templatesDir) {
            this._showTemplatesNotFoundError();
            return;
        }

        const homeDir = GLib.get_home_dir();
        const configBase = homeDir + '/.config';
        const temaThemeDir = configBase + '/dotfiles/themes/tema';

        print('Templates directory:', templatesDir);
        print('Tema theme directory:', temaThemeDir);

        this._processAllTemplates(templatesDir, temaThemeDir, colors);
        this._finalizeTheme(homeDir, configBase, temaThemeDir, colors);

        print('✓ Template generation complete!');
        this.app.temaTheming.applyDynamicTheming();
    }

    _showTemplatesNotFoundError() {
        const possibleDirs = this.getTemplatePaths();
        this.app.showError(
            `Templates directory not found!\nChecked paths:\n${possibleDirs.join('\n')}`
        );
    }

    _processAllTemplates(templatesDir, temaThemeDir, colors) {
        this.processTemplates(templatesDir, temaThemeDir, colors);
        this.copyStaticFiles(templatesDir, temaThemeDir);
        this.generateIconsTheme(temaThemeDir, colors);
        this.handleLightMode(colors, temaThemeDir);
    }

    _finalizeTheme(homeDir, configBase, temaThemeDir, colors) {
        // Wallpapers already exist in themes/tema/backgrounds, no symlink needed
        this.applyDotfilesTheme();
        this.setDotfilesBackground(colors, configBase);
    }

    readPywalColors() {
        const colorsFile = Gio.File.new_for_path(
            GLib.get_home_dir() + '/.cache/wal/colors.json'
        );

        if (!colorsFile.query_exists(null)) {
            return null;
        }

        try {
            const [success, content] = colorsFile.load_contents(null);
            if (!success) {
                return null;
            }

            const jsonContent = new TextDecoder('utf-8').decode(content);
            const data = JSON.parse(jsonContent);

            return this._buildColorsObject(data);
        } catch (error) {
            print('Error reading pywal colors:', error.message);
            return null;
        }
    }

    _buildColorsObject(data) {
        const colors = {
            background: data.special.background,
            foreground: data.special.foreground,
            cursor: data.special.cursor,
            wallpaper: data.wallpaper,
        };

        for (let i = 0; i < 16; i++) {
            colors[`color${i}`] = data.colors[`color${i}`];
        }

        return colors;
    }

    findTemplatesDirectory() {
        const possibleDirs = this.getTemplatePaths();

        for (const dir of possibleDirs) {
            const templatesDirFile = Gio.File.new_for_path(dir);
            if (templatesDirFile.query_exists(null)) {
                return dir;
            }
        }
        return null;
    }

    getTemplatePaths() {
        return [
            GLib.get_current_dir() + '/templates',
            '/usr/share/tema/templates',
            '/usr/local/share/tema/templates',
            GLib.get_home_dir() + '/.local/share/tema/templates',
            GLib.get_home_dir() + '/Code/tema/templates',
        ];
    }

    processTemplates(templatesDir, temaThemeDir, colors) {
        const templateMappings = [
            ['alacritty.toml', temaThemeDir + '/alacritty.toml'],
            ['kitty.conf', temaThemeDir + '/kitty.conf'],
            ['waybar.css', temaThemeDir + '/waybar.css'],
            ['hyprland.conf', temaThemeDir + '/hyprland.conf'],
            ['mako.ini', temaThemeDir + '/mako.ini'],
            ['ghostty.conf', temaThemeDir + '/ghostty.conf'],
            ['wofi.css', temaThemeDir + '/wofi.css'],
            ['btop.theme', temaThemeDir + '/btop.theme'],
            ['swayosd.css', temaThemeDir + '/swayosd.css'],
            ['walker.css', temaThemeDir + '/walker.css'],
            ['hyprlock.conf', temaThemeDir + '/hyprlock.conf'],
            ['chromium.theme', temaThemeDir + '/chromium.theme'],
        ];

        for (const [templateName, temaOutput] of templateMappings) {
            const templateFile = Gio.File.new_for_path(
                templatesDir + '/' + templateName
            );
            if (templateFile.query_exists(null)) {
                this.processTemplate(
                    templateFile.get_path(),
                    temaOutput,
                    colors
                );
            }
        }
    }

    hexToRgb(hex) {
        return ColorUtils.hexToRgb(hex);
    }

    processTemplate(templatePath, outputPath, colors) {
        const templateFile = Gio.File.new_for_path(templatePath);
        const [success, content] = templateFile.load_contents(null);

        if (!success) {
            print('Error reading template:', templatePath);
            return;
        }

        try {
            const templateContent = new TextDecoder('utf-8').decode(content);
            const processedContent = this._replaceColorPlaceholders(
                templateContent,
                colors
            );
            this._writeOutputFile(outputPath, processedContent);

            print('✓ Generated:', outputPath);
        } catch (error) {
            print('Error processing template:', templatePath, error.message);
        }
    }

    _replaceColorPlaceholders(templateContent, colors) {
        let content = templateContent;

        for (const [key, value] of Object.entries(colors)) {
            content = content.replace(
                new RegExp(`\\{${key}\\.strip\\}`, 'g'),
                ColorUtils.stripHash(value)
            );
            content = content.replace(
                new RegExp(`\\{${key}\\.rgb\\}`, 'g'),
                this.hexToRgb(value)
            );
            content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        return content;
    }

    _writeOutputFile(outputPath, content) {
        const outputFile = Gio.File.new_for_path(outputPath);
        const outputDir = outputFile.get_parent();

        if (!outputDir.query_exists(null)) {
            outputDir.make_directory_with_parents(null);
        }

        const encodedContent = new TextEncoder('utf-8').encode(content);
        outputFile.replace_contents(
            encodedContent,
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null
        );
    }

    copyStaticFiles(templatesDir, temaThemeDir) {
        const staticFiles = ['neovim.lua'];

        for (const staticFile of staticFiles) {
            const sourceFile = Gio.File.new_for_path(
                templatesDir + '/' + staticFile
            );
            const destFile = Gio.File.new_for_path(
                temaThemeDir + '/' + staticFile
            );

            if (sourceFile.query_exists(null)) {
                try {
                    sourceFile.copy(
                        destFile,
                        Gio.FileCopyFlags.OVERWRITE,
                        null,
                        null
                    );
                    print('✓ Copied static file:', staticFile);
                } catch (error) {
                    print(
                        'Warning: Could not copy',
                        staticFile,
                        ':',
                        error.message
                    );
                }
            }
        }
    }

    generateIconsTheme(temaThemeDir, colors) {
        // Use color1 (the primary accent color) to determine the Yaru theme
        const accentColor = colors.color1 || colors.color4;
        const yaruTheme = ColorUtils.hexToYaruTheme(accentColor);

        const iconsThemePath = temaThemeDir + '/icons.theme';

        try {
            this._writeOutputFile(iconsThemePath, yaruTheme + '\n');
            print('✓ Generated icons.theme with', yaruTheme);
        } catch (error) {
            print('Error generating icons.theme:', error.message);
        }
    }

    handleLightMode(colors, temaThemeDir) {
        const isLightMode = this._isLightMode(colors.background);
        const lightModeFile = Gio.File.new_for_path(
            temaThemeDir + '/light.mode'
        );

        if (isLightMode) {
            this._createLightModeFile(lightModeFile);
        } else {
            this._removeLightModeFile(lightModeFile);
        }
    }

    _isLightMode(backgroundColor) {
        const luminance = ColorUtils.calculateLuminance(backgroundColor);
        return luminance > LUMINANCE_LIGHT_THRESHOLD;
    }

    _createLightModeFile(lightModeFile) {
        try {
            lightModeFile.create(Gio.FileCreateFlags.NONE, null);
            print('✓ Light mode detected - created light.mode file');
        } catch (error) {
            print('Error creating light.mode file:', error.message);
        }
    }

    _removeLightModeFile(lightModeFile) {
        if (!lightModeFile.query_exists(null)) {
            return;
        }

        try {
            lightModeFile.delete(null);
            print('✓ Dark mode detected - removed light.mode file');
        } catch (error) {
            print('Error removing light.mode file:', error.message);
        }
    }

    symlinkWallpapers(homeDir, temaThemeDir) {
        const wallpapersDir = homeDir + '/Wallpapers';
        const backgroundsDir = temaThemeDir + '/backgrounds';

        const wallpapersFile = Gio.File.new_for_path(wallpapersDir);

        if (!wallpapersFile.query_exists(null)) {
            print('Warning:', wallpapersDir, 'directory not found');
            return;
        }

        try {
            this._removeExistingBackgroundsDir(backgroundsDir);
            const backgroundsFile = Gio.File.new_for_path(backgroundsDir);
            backgroundsFile.make_symbolic_link(wallpapersDir, null);
            print('✓ Symlinked', wallpapersDir, 'to', backgroundsDir);
        } catch (error) {
            print('Error symlinking wallpapers:', error.message);
        }
    }

    _removeExistingBackgroundsDir(backgroundsDir) {
        const backgroundsFile = Gio.File.new_for_path(backgroundsDir);

        if (!backgroundsFile.query_exists(null)) {
            return;
        }

        const fileType = backgroundsFile.query_file_type(
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
            null
        );

        if (fileType === Gio.FileType.SYMBOLIC_LINK) {
            backgroundsFile.delete(null);
            return;
        }

        const deleteProcess = new Gio.Subprocess({
            argv: ['rm', '-rf', backgroundsDir],
            flags: Gio.SubprocessFlags.NONE,
        });
        deleteProcess.init(null);
        deleteProcess.wait(null);
    }

    setDotfilesBackground(colors, configBase) {
        if (!colors.wallpaper) {
            print('Warning: Could not determine current wallpaper from pywal');
            return;
        }

        if (!this._validateWallpaperFile(colors.wallpaper)) {
            return;
        }

        try {
            const backgroundLink = configBase + '/dotfiles/current/background';
            this._createBackgroundSymlink(backgroundLink, colors.wallpaper);
            this.app.wallpaperManager.restartSwaybg(backgroundLink);
        } catch (error) {
            print('Error setting dotfiles background:', error.message);
        }
    }

    _validateWallpaperFile(wallpaperPath) {
        const wallpaperFile = Gio.File.new_for_path(wallpaperPath);

        if (!wallpaperFile.query_exists(null)) {
            print('Warning: Wallpaper file does not exist:', wallpaperPath);
            return false;
        }

        if (!this.isImageFile(wallpaperPath)) {
            print(
                'Warning: File is not a recognized image format:',
                wallpaperPath
            );
            return false;
        }

        return true;
    }

    _createBackgroundSymlink(backgroundLink, wallpaperPath) {
        const backgroundFile = Gio.File.new_for_path(backgroundLink);

        if (backgroundFile.query_exists(null)) {
            backgroundFile.delete(null);
        }

        backgroundFile.make_symbolic_link(wallpaperPath, null);
        print('✓ Set background symlink:', wallpaperPath);
    }

    applyDotfilesTheme() {
        try {
            if (!SubprocessUtils.checkCommandExists('theme-set')) {
                print('Warning: theme-set command not found');
                return;
            }

            const applyProcess = new Gio.Subprocess({
                argv: ['theme-set', 'tema'],
                flags:
                    Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_PIPE,
            });
            applyProcess.init(null);
            const [, stdout, stderr] = applyProcess.communicate_utf8(
                null,
                null
            );

            if (applyProcess.get_successful()) {
                print('✓ Dotfiles tema theme applied!');
            } else {
                print('Error applying dotfiles theme:', stderr);
            }
        } catch (error) {
            print('Error applying dotfiles theme:', error.message);
        }
    }

    isImageFile(fileName) {
        const lowerFileName = fileName.toLowerCase();
        return IMAGE_EXTENSIONS.some(ext => lowerFileName.endsWith(ext));
    }

    ejectTheme(imagePath, fileName, lightMode, outputPath) {
        print(`Ejecting theme to: ${outputPath}`);

        const walPath = this.app.wallpaperManager.findWalExecutable();
        if (!walPath) {
            this.app.showError('Error: wal not found. Please install pywal.');
            return;
        }

        const spinnerDialog = this._showEjectionSpinner();
        this._runWalAndEject(
            walPath,
            imagePath,
            lightMode,
            outputPath,
            spinnerDialog
        );
    }

    _runWalAndEject(walPath, imagePath, lightMode, outputPath, spinnerDialog) {
        const walArgs = this._buildWalArgsForEjection(
            walPath,
            imagePath,
            lightMode
        );
        const launcher = this._createWalLauncher();
        const walProcess = launcher.spawnv(walArgs);

        walProcess.communicate_utf8_async(null, null, (source, result) => {
            this._handleEjectionWalResult(
                walProcess,
                result,
                outputPath,
                imagePath,
                spinnerDialog
            );
        });
    }

    _buildWalArgsForEjection(walPath, imagePath, lightMode) {
        const baseArgs = [walPath, '-n', '-s', '-t', '-e', '-i', imagePath];
        if (lightMode) {
            baseArgs.splice(5, 0, '-l');
        }
        return baseArgs;
    }

    _createWalLauncher() {
        return SubprocessUtils.createSubprocessLauncher();
    }

    _handleEjectionWalResult(
        walProcess,
        result,
        outputPath,
        imagePath,
        spinnerDialog
    ) {
        try {
            const [, , walStderr] = walProcess.communicate_utf8_finish(result);

            if (walProcess.get_successful()) {
                this._processEjectedTheme(outputPath, imagePath, spinnerDialog);
            } else {
                spinnerDialog.destroy();
                this.app.showError(`Error running wal: ${walStderr}`);
            }
        } catch (error) {
            spinnerDialog.destroy();
            this.app.showError(`Error: ${error.message}`);
        }
    }

    _processEjectedTheme(outputPath, imagePath, spinnerDialog) {
        const colors = this.readPywalColors();

        if (!colors) {
            spinnerDialog.destroy();
            this.app.showError('Error: Could not read pywal colors');
            return;
        }

        this._createEjectedTheme(outputPath, colors, imagePath, spinnerDialog);
    }

    _createEjectedTheme(outputPath, colors, imagePath, spinnerDialog) {
        const templatesDir = this.findTemplatesDirectory();

        if (!templatesDir) {
            spinnerDialog.destroy();
            this.app.showError('Templates directory not found!');
            return;
        }

        try {
            this._createOutputDirectory(outputPath);
            this._processAllTemplates(templatesDir, outputPath, colors);
            this._copyWallpaperToOutput(imagePath, outputPath);

            spinnerDialog.destroy();
            this.app.showSuccess(
                `Theme ejected successfully to:\n${outputPath}`
            );
            print(`✓ Theme ejected to: ${outputPath}`);
        } catch (error) {
            spinnerDialog.destroy();
            this.app.showError(`Error creating theme: ${error.message}`);
        }
    }

    _createOutputDirectory(outputPath) {
        const outputDir = Gio.File.new_for_path(outputPath);
        if (!outputDir.query_exists(null)) {
            outputDir.make_directory_with_parents(null);
        }
    }

    _copyWallpaperToOutput(imagePath, outputPath) {
        const backgroundsDir = Gio.File.new_for_path(
            outputPath + '/backgrounds'
        );

        if (!backgroundsDir.query_exists(null)) {
            backgroundsDir.make_directory(null);
        }

        const wallpaperFile = Gio.File.new_for_path(imagePath);
        const wallpaperName = wallpaperFile.get_basename();
        const destWallpaper = Gio.File.new_for_path(
            outputPath + '/backgrounds/' + wallpaperName
        );
        wallpaperFile.copy(
            destWallpaper,
            Gio.FileCopyFlags.OVERWRITE,
            null,
            null
        );
    }

    _showEjectionSpinner() {
        const dialog = new Adw.MessageDialog({
            transient_for: this.app.get_active_window(),
            modal: true,
            heading: 'Ejecting Theme...',
            body: 'Generating colors and creating theme files...',
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
}
