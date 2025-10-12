#!/usr/bin/env gjs

import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';

import {ThumbnailManager} from './components/ThumbnailManager.js';
import {DialogManager} from './utils/DialogManager.js';
import {ThemeGenerator} from './services/ThemeGenerator.js';
import {WallpaperManager} from './services/WallpaperManager.js';
import {TemaTheming} from './services/TemaTheming.js';

Adw.init();

const APP_ID = 'li.oever.tema';
const SETTINGS_SCHEMA = 'li.oever.tema';

// Keyboard key codes
const KEY_ENTER = 65293;
const KEY_ESCAPE = 65307;
const KEY_Q = 113;
const KEY_E = 101;
const KEY_QUESTION = 63;

const TemaApp = GObject.registerClass(
    class TemaApp extends Adw.Application {
        constructor() {
            super({application_id: APP_ID});
            GLib.set_prgname(APP_ID);

            this.initializeManagers();
            this.loadSettings();
        }

        initializeManagers() {
            this.thumbnailManager = new ThumbnailManager();
            this.dialogManager = new DialogManager(this);
            this.themeGenerator = new ThemeGenerator(this);
            this.wallpaperManager = new WallpaperManager(this);
            this.temaTheming = new TemaTheming();
        }

        loadSettings() {
            const homeDir = GLib.get_home_dir();
            const configDir = homeDir + '/.config/tema';
            const configFile = Gio.File.new_for_path(
                configDir + '/settings.json'
            );

            if (!configFile.query_exists(null)) {
                this.settings = {defaultMode: 'ask'};
                return;
            }

            try {
                const [success, contents] = configFile.load_contents(null);
                if (success) {
                    const jsonContent = new TextDecoder('utf-8').decode(
                        contents
                    );
                    this.settings = JSON.parse(jsonContent);
                } else {
                    this.settings = {defaultMode: 'ask'};
                }
            } catch (error) {
                print('Error loading settings:', error.message);
                this.settings = {defaultMode: 'ask'};
            }
        }

        saveSettings() {
            const homeDir = GLib.get_home_dir();
            const configDir = homeDir + '/.config/tema';
            const configDirFile = Gio.File.new_for_path(configDir);

            if (!configDirFile.query_exists(null)) {
                configDirFile.make_directory_with_parents(null);
            }

            const configFile = Gio.File.new_for_path(
                configDir + '/settings.json'
            );
            const jsonContent = JSON.stringify(this.settings, null, 2);
            const encodedContent = new TextEncoder('utf-8').encode(jsonContent);

            configFile.replace_contents(
                encodedContent,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );
        }

        vfunc_activate() {
            this.initializeWallpapersDirectory();
            this.loadCustomCSS();
            this.temaTheming.applyDynamicTheming();

            const window = this.createMainWindow();
            const mainBox = this.createMainContent();
            const headerBar = this.createHeaderBar();
            const {scrolled, grid} = this.createImageGrid();

            mainBox.append(headerBar);
            mainBox.append(scrolled);
            this.loadWallpaperImages(grid);
            this.setupKeyboardHandling(window, grid);

            window.set_content(mainBox);
            window.present();

            // Focus first image after window is presented
            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                const firstChild = grid.get_first_child();
                if (firstChild) {
                    grid.select_child(firstChild);
                    grid.grab_focus();
                }
                return GLib.SOURCE_REMOVE;
            });
        }

        initializeWallpapersDirectory() {
            const homeDir = GLib.get_home_dir();
            const wallpapersDir = Gio.File.new_for_path(
                homeDir + '/.config/dotfiles/themes/tema/backgrounds'
            );

            this._ensureWallpapersDirectoryExists(wallpapersDir);
        }

        _ensureWallpapersDirectoryExists(wallpapersDir) {
            if (wallpapersDir.query_exists(null)) {
                return;
            }

            try {
                wallpapersDir.make_directory_with_parents(null);
                print('✓ Created tema backgrounds directory');
            } catch (error) {
                print('Error creating tema backgrounds directory:', error.message);
            }
        }

        loadCustomCSS() {
            const cssProvider = new Gtk.CssProvider();

            if (this._tryLoadCSSFromFile(cssProvider)) {
                return;
            }

            this._tryLoadCSSFromResource(cssProvider);
        }

        _tryLoadCSSFromFile(cssProvider) {
            const cssPath = GLib.get_current_dir() + '/src/style.css';
            const cssFile = Gio.File.new_for_path(cssPath);

            if (!cssFile.query_exists(null)) {
                return false;
            }

            try {
                cssProvider.load_from_file(cssFile);
                this._applyStyleProvider(cssProvider);
                print('✓ Custom CSS loaded from file:', cssPath);
                return true;
            } catch (error) {
                print('Error loading CSS from file:', error.message);
                return false;
            }
        }

        _tryLoadCSSFromResource(cssProvider) {
            try {
                cssProvider.load_from_resource('/li/oever/tema/js/style.css');
                this._applyStyleProvider(cssProvider);
                print('✓ Custom CSS loaded from gresource');
            } catch (error) {
                print('Note: Custom CSS not loaded from gresource');
            }
        }

        _applyStyleProvider(cssProvider) {
            Gtk.StyleContext.add_provider_for_display(
                Gdk.Display.get_default(),
                cssProvider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            );
        }

        createMainWindow() {
            return new Adw.ApplicationWindow({
                application: this,
                default_width: 800,
                default_height: 600,
            });
        }

        createMainContent() {
            return new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 0,
            });
        }

        createHeaderBar() {
            const headerBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 0,
                margin_top: 4,
                margin_bottom: 4,
                margin_start: 8,
                margin_end: 8,
                can_focus: false,
            });

            const titleButton = new Gtk.Button({
                label: 'Tēma',
                has_frame: false,
                css_classes: ['flat', 'small-button'],
                focus_on_click: false,
            });

            titleButton.connect('clicked', () => {
                this._openGitHubRepo();
            });

            const settingsButton = new Gtk.Button({
                icon_name: 'emblem-system-symbolic',
                has_frame: false,
                css_classes: ['flat', 'small-button'],
                focus_on_click: false,
            });

            settingsButton.connect('clicked', () => {
                this._showSettingsPanel();
            });

            headerBox.append(titleButton);
            headerBox.append(new Gtk.Box({hexpand: true}));
            headerBox.append(settingsButton);

            return headerBox;
        }

        _openGitHubRepo() {
            try {
                Gtk.show_uri(
                    null,
                    'https://github.com/bjarneo/tema',
                    Gdk.CURRENT_TIME
                );
            } catch (error) {
                print('Error opening GitHub URL:', error.message);
            }
        }

        _showSettingsPanel() {
            const window = this.get_active_window();
            const dialog = new Adw.Window({
                transient_for: window,
                modal: true,
                default_width: 400,
                default_height: 300,
                title: 'Settings',
            });

            const keyController = new Gtk.EventControllerKey();
            dialog.add_controller(keyController);

            keyController.connect('key-pressed', (controller, keyval) => {
                if (keyval === KEY_ESCAPE) {
                    dialog.close();
                    return true;
                }
                return false;
            });

            this.dialogManager.addVimKeybindings(dialog);

            const headerBar = new Adw.HeaderBar();
            const toolbarView = new Adw.ToolbarView();
            toolbarView.add_top_bar(headerBar);

            const contentBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 12,
                margin_top: 24,
                margin_bottom: 24,
                margin_start: 24,
                margin_end: 24,
            });

            const modeLabel = new Gtk.Label({
                label: 'Default Wallpaper Mode',
                xalign: 0,
                css_classes: ['title-4'],
            });

            const modeRow = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 12,
                margin_top: 12,
            });

            const modeDropDown = new Gtk.DropDown({
                model: Gtk.StringList.new([
                    'Ask Every Time',
                    'Always Dark',
                    'Always Light',
                ]),
                hexpand: true,
            });

            const modeMap = {
                ask: 0,
                dark: 1,
                light: 2,
            };

            const reverseModeMap = {
                0: 'ask',
                1: 'dark',
                2: 'light',
            };

            modeDropDown.set_selected(modeMap[this.settings.defaultMode] || 0);

            modeDropDown.connect('notify::selected', () => {
                const selected = modeDropDown.get_selected();
                this.settings.defaultMode = reverseModeMap[selected];
                this.saveSettings();
            });

            modeRow.append(modeDropDown);

            contentBox.append(modeLabel);
            contentBox.append(modeRow);

            toolbarView.set_content(contentBox);
            dialog.set_content(toolbarView);
            dialog.present();
        }

        createImageGrid() {
            const scrolled = new Gtk.ScrolledWindow({
                hexpand: true,
                vexpand: true,
                margin_top: 12,
                margin_bottom: 12,
                margin_start: 12,
                margin_end: 12,
            });

            const grid = new Gtk.FlowBox({
                valign: Gtk.Align.START,
                max_children_per_line: 6,
                selection_mode: Gtk.SelectionMode.SINGLE,
                column_spacing: 4,
                row_spacing: 4,
                can_focus: true,
                activate_on_single_click: false,
            });

            this.connectGridEvents(grid);
            scrolled.set_child(grid);

            return {scrolled, grid};
        }

        connectGridEvents(grid) {
            grid.connect('child-activated', (flowbox, child) => {
                const box = child.get_child();
                if (box && box._filePath) {
                    this.handleWallpaperSelection(box._filePath, box._fileName);
                }
            });
        }

        loadWallpaperImages(grid) {
            const wallpapersPath = GLib.get_home_dir() + '/.config/dotfiles/themes/tema/backgrounds';
            const wallpapersDir = Gio.File.new_for_path(wallpapersPath);

            if (!wallpapersDir.query_exists(null)) {
                this.showNoWallpapersMessage(grid);
                return;
            }

            try {
                const imageFiles = this.scanWallpaperDirectory(
                    wallpapersDir,
                    wallpapersPath
                );
                this.thumbnailManager.loadThumbnailsAsync(grid, imageFiles, 0);
            } catch (error) {
                this.showDirectoryError(grid, error);
            }
        }

        scanWallpaperDirectory(wallpapersDir, wallpapersPath) {
            const enumerator = wallpapersDir.enumerate_children(
                'standard::name,standard::type',
                Gio.FileQueryInfoFlags.NONE,
                null
            );

            const imageFiles = [];
            let fileInfo;

            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const fileName = fileInfo.get_name();
                const filePath = wallpapersPath + '/' + fileName;

                if (this.thumbnailManager.isImageFile(fileName)) {
                    imageFiles.push({filePath, fileName});
                }
            }

            enumerator.close(null);
            return imageFiles;
        }

        showNoWallpapersMessage(grid) {
            const label = new Gtk.Label({
                label: 'Wallpapers directory not found!',
                margin_top: 50,
            });
            grid.append(label);
        }

        showDirectoryError(grid, error) {
            print('Error reading wallpapers directory:', error.message);
            const label = new Gtk.Label({
                label: 'Error reading wallpapers directory',
                margin_top: 50,
            });
            grid.append(label);
        }

        setupKeyboardHandling(window, grid) {
            const keyController = new Gtk.EventControllerKey();
            window.add_controller(keyController);

            keyController.connect(
                'key-pressed',
                (controller, keyval, keycode, state) => {
                    return this.handleKeyPress(keyval, window, grid);
                }
            );

            grid.grab_focus();
        }

        handleKeyPress(keyval, window, grid) {
            if (this._handleVimNavigation(keyval, grid)) {
                return true;
            }

            return this._handleActionKey(keyval, window, grid);
        }

        _handleVimNavigation(keyval, grid) {
            const VIM_KEY_MAP = {
                104: Gtk.DirectionType.LEFT, // h
                106: Gtk.DirectionType.DOWN, // j
                107: Gtk.DirectionType.UP, // k
                108: Gtk.DirectionType.RIGHT, // l
            };

            const direction = VIM_KEY_MAP[keyval];
            if (direction === undefined) {
                return false;
            }

            grid.child_focus(direction);
            return true;
        }

        _handleActionKey(keyval, window, grid) {
            switch (keyval) {
                case KEY_ENTER:
                    return this._handleEnterKey(grid);
                case KEY_E:
                    return this._handleEjectKey(grid);
                case KEY_QUESTION:
                    this.dialogManager.showHelpModal(window);
                    return true;
                case KEY_Q:
                case KEY_ESCAPE:
                    window.close();
                    return true;
                default:
                    return false;
            }
        }

        _handleEnterKey(grid) {
            const selectedBox = this._getSelectedBox(grid);
            if (!selectedBox) {
                return true;
            }

            this.handleWallpaperSelection(
                selectedBox._filePath,
                selectedBox._fileName
            );
            return true;
        }

        _handleEjectKey(grid) {
            const selectedBox = this._getSelectedBox(grid);
            if (!selectedBox) {
                return true;
            }

            this.handleThemeEjection(
                selectedBox._filePath,
                selectedBox._fileName
            );
            return true;
        }

        _getSelectedBox(grid) {
            const selected = grid.get_selected_children();
            if (selected.length === 0) {
                return null;
            }

            const selectedBox = selected[0].get_child();
            if (!selectedBox || !selectedBox._filePath) {
                return null;
            }

            return selectedBox;
        }

        handleWallpaperSelection(filePath, fileName) {
            const window = this.get_active_window();

            if (this.settings.defaultMode === 'dark') {
                this.setWallpaper(filePath, fileName, false);
                return;
            }

            if (this.settings.defaultMode === 'light') {
                this.setWallpaper(filePath, fileName, true);
                return;
            }

            this.dialogManager.showModeDialog(
                window,
                filePath,
                fileName,
                (path, name, isLight) => this.setWallpaper(path, name, isLight)
            );
        }

        handleThemeEjection(filePath, fileName) {
            const window = this.get_active_window();
            this.dialogManager.showThemeEjectionDialog(
                window,
                filePath,
                fileName,
                (path, name, isLight, outputPath) =>
                    this.themeGenerator.ejectTheme(
                        path,
                        name,
                        isLight,
                        outputPath
                    )
            );
        }

        setWallpaper(imagePath, fileName, lightMode) {
            this.wallpaperManager.setWallpaper(imagePath, fileName, lightMode);
            // Reapply theming based on selected mode
            this.temaTheming.applyDynamicTheming(!lightMode);
        }

        showError(message) {
            this.dialogManager.showError(message);
        }

        showSuccess(message) {
            this.dialogManager.showSuccess(message);
        }
    }
);

// Run the application
const app = new TemaApp();
app.run([]);
