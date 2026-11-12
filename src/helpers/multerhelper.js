const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const allowedImageTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

const generateStorage = (name) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const folderPath = path.join('public/uploads', name);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            cb(null, folderPath);
        },

        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).slice(1).toLowerCase();
            const filename = `admin-${file.fieldname}-${Date.now()}.${ext}`;
            cb(null, filename);
        },
    });

    const fileFilter = (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1).toLowerCase();
        const allowedMime = allowedImageTypes[ext];

        if (!allowedMime) {
            return cb(new Error('Invalid file type. Only PNG, JPEG, and WebP images are allowed.'));
        }
        // Accept the exact image MIME or a generic octet-stream (some mobile clients).
        if (file.mimetype !== allowedMime && file.mimetype !== 'application/octet-stream') {
            return cb(new Error('Invalid file type. Only PNG, JPEG, and WebP images are allowed.'));
        }
        cb(null, true);
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE, files: 10 },
    });
};

module.exports = generateStorage;
