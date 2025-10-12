import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';

import {SubprocessUtils} from '../utils/SubprocessUtils.js';

const THUMBNAIL_SIZE = 92;
const IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.tiff',
];

export class ThumbnailManager {
    constructor() {
        this.cacheDir = null;
        this.isImageMagickAvailable = null;
    }

    ensureCacheDirectory() {
        if (this.cacheDir) {
            return this.cacheDir;
        }

        this.cacheDir = GLib.get_home_dir() + '/.cache/tema/thumbnails';
        this._createCacheDirectoryIfNeeded();
        return this.cacheDir;
    }

    _createCacheDirectoryIfNeeded() {
        const cacheDirFile = Gio.File.new_for_path(this.cacheDir);

        if (cacheDirFile.query_exists(null)) {
            return;
        }

        try {
            cacheDirFile.make_directory_with_parents(null);
            print('✓ Created thumbnail cache directory:', this.cacheDir);
        } catch (error) {
            print('Error creating cache directory:', error.message);
            throw error;
        }
    }

    getThumbnailPath(filePath) {
        const cacheDir = this.ensureCacheDirectory();
        const hash = this.hashString(filePath);
        const fileExt = filePath.toLowerCase().split('.').pop();
        return `${cacheDir}/${hash}.${fileExt}`;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    createPlaceholder(grid, filePath, fileName) {
        const placeholderWidget = this._createPlaceholderWidget();
        const box = this._createThumbnailBox(
            placeholderWidget,
            filePath,
            fileName
        );
        grid.append(box);
        return box;
    }

    _createPlaceholderWidget() {
        const placeholderPath = GLib.get_current_dir() + '/placeholder.png';
        const placeholderFile = Gio.File.new_for_path(placeholderPath);

        if (!placeholderFile.query_exists(null)) {
            return this._createSpinnerWidget();
        }

        try {
            const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
                placeholderPath,
                THUMBNAIL_SIZE,
                THUMBNAIL_SIZE,
                true
            );
            const picture = new Gtk.Picture();
            picture.set_pixbuf(pixbuf);
            picture.set_can_shrink(false);
            return picture;
        } catch (error) {
            return this._createSpinnerWidget();
        }
    }

    _createSpinnerWidget() {
        return new Gtk.Spinner({
            spinning: true,
            width_request: THUMBNAIL_SIZE,
            height_request: THUMBNAIL_SIZE,
        });
    }

    _createThumbnailBox(placeholderWidget, filePath, fileName) {
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
            margin_top: 2,
            margin_bottom: 2,
            margin_start: 2,
            margin_end: 2,
        });

        box.append(placeholderWidget);
        box._filePath = filePath;
        box._fileName = fileName;
        box._placeholderWidget = placeholderWidget;

        return box;
    }

    loadThumbnailForPlaceholder(placeholder, filePath, fileName) {
        const thumbnailPath = this.getThumbnailPath(filePath);
        const thumbnailFile = Gio.File.new_for_path(thumbnailPath);

        if (thumbnailFile.query_exists(null)) {
            this._loadCachedThumbnail(placeholder, thumbnailPath);
            return;
        }

        this._generateThumbnail(placeholder, filePath, thumbnailPath, fileName);
    }

    checkImageMagick(callback) {
        if (this.isImageMagickAvailable !== null) {
            callback(this.isImageMagickAvailable);
            return;
        }

        SubprocessUtils.checkCommandExists('magick', available => {
            this.isImageMagickAvailable = available;
            callback(available);
        });
    }

    _generateThumbnail(placeholder, filePath, thumbnailPath, fileName) {
        this.ensureCacheDirectory();

        this.checkImageMagick(available => {
            if (available) {
                this._generateThumbnailWithImageMagick(
                    placeholder,
                    filePath,
                    thumbnailPath
                );
            } else {
                this._generateThumbnailFallback(
                    placeholder,
                    filePath,
                    fileName
                );
            }
        });
    }

    _generateThumbnailWithImageMagick(placeholder, filePath, thumbnailPath) {
        try {
            const subprocess = new Gio.Subprocess({
                argv: [
                    'magick',
                    filePath,
                    '-resize',
                    `${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE}^`,
                    '-gravity',
                    'center',
                    '-extent',
                    `${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE}`,
                    thumbnailPath,
                ],
                flags: Gio.SubprocessFlags.STDERR_PIPE,
            });
            subprocess.init(null);

            subprocess.communicate_utf8_async(null, null, (source, result) => {
                this._handleImageMagickResult(
                    subprocess,
                    result,
                    placeholder,
                    filePath,
                    thumbnailPath
                );
            });
        } catch (error) {
            print('Error starting ImageMagick:', error.message);
            this._generateThumbnailFallback(placeholder, filePath, 'unknown');
        }
    }

    _handleImageMagickResult(
        subprocess,
        result,
        placeholder,
        filePath,
        thumbnailPath
    ) {
        try {
            const [, , stderr] = subprocess.communicate_utf8_finish(result);

            if (subprocess.get_successful()) {
                this._loadCachedThumbnail(placeholder, thumbnailPath);
            } else {
                print('ImageMagick error:', stderr);
                this._generateThumbnailFallback(
                    placeholder,
                    filePath,
                    'unknown'
                );
            }
        } catch (error) {
            print('Error with ImageMagick process:', error.message);
            this._generateThumbnailFallback(placeholder, filePath, 'unknown');
        }
    }

    _generateThumbnailFallback(placeholder, filePath, fileName) {
        try {
            const originalPixbuf = GdkPixbuf.Pixbuf.new_from_file(filePath);
            const scaledPixbuf = this._scalePixbufToFill(originalPixbuf);
            const croppedPixbuf = this._cropPixbufToCenter(scaledPixbuf);

            this._replacePlaceholderWithImage(placeholder, croppedPixbuf);
        } catch (error) {
            print(
                `Error in fallback thumbnail generation for ${fileName}:`,
                error.message
            );
            this._showThumbnailError(placeholder);
        }
    }

    _scalePixbufToFill(pixbuf) {
        const origWidth = pixbuf.get_width();
        const origHeight = pixbuf.get_height();

        const scaleX = THUMBNAIL_SIZE / origWidth;
        const scaleY = THUMBNAIL_SIZE / origHeight;
        const scale = Math.max(scaleX, scaleY);

        const scaledWidth = Math.round(origWidth * scale);
        const scaledHeight = Math.round(origHeight * scale);

        return pixbuf.scale_simple(
            scaledWidth,
            scaledHeight,
            GdkPixbuf.InterpType.BILINEAR
        );
    }

    _cropPixbufToCenter(pixbuf) {
        const width = pixbuf.get_width();
        const height = pixbuf.get_height();

        const cropX = Math.max(0, Math.round((width - THUMBNAIL_SIZE) / 2));
        const cropY = Math.max(0, Math.round((height - THUMBNAIL_SIZE) / 2));

        return pixbuf.new_subpixbuf(
            cropX,
            cropY,
            THUMBNAIL_SIZE,
            THUMBNAIL_SIZE
        );
    }

    _replacePlaceholderWithImage(placeholder, pixbuf) {
        const image = new Gtk.Picture();
        image.set_pixbuf(pixbuf);
        image.set_can_shrink(false);

        const placeholderWidget = placeholder._placeholderWidget;
        placeholder.remove(placeholderWidget);
        placeholder.prepend(image);
    }

    _loadCachedThumbnail(placeholder, thumbnailPath) {
        try {
            const pixbuf = GdkPixbuf.Pixbuf.new_from_file(thumbnailPath);
            this._replacePlaceholderWithImage(placeholder, pixbuf);
        } catch (error) {
            print('Error loading cached thumbnail:', error.message);
            this._showThumbnailError(placeholder);
        }
    }

    _showThumbnailError(placeholder) {
        const placeholderWidget = placeholder._placeholderWidget;
        placeholder.remove(placeholderWidget);

        const errorLabel = new Gtk.Label({
            label: '❌',
            width_request: THUMBNAIL_SIZE,
            height_request: THUMBNAIL_SIZE,
        });
        placeholder.prepend(errorLabel);
    }

    loadThumbnailsAsync(grid, imageFiles, index) {
        if (index >= imageFiles.length) {
            return;
        }

        const {filePath, fileName} = imageFiles[index];
        const placeholder = this.createPlaceholder(grid, filePath, fileName);

        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            try {
                this.loadThumbnailForPlaceholder(
                    placeholder,
                    filePath,
                    fileName
                );
            } catch (error) {
                print(
                    `Error loading thumbnail for ${fileName}:`,
                    error.message
                );
            }

            this.loadThumbnailsAsync(grid, imageFiles, index + 1);
            return GLib.SOURCE_REMOVE;
        });
    }

    isImageFile(fileName) {
        const lowerFileName = fileName.toLowerCase();
        return IMAGE_EXTENSIONS.some(ext => lowerFileName.endsWith(ext));
    }
}
