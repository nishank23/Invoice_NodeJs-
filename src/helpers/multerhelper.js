const multer = require('multer');
const path = require('path');
const fs = require('fs');

const generateStorage = (name) => {

    const allowedImageExtensions = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
    };
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const folderPath = path.join('public/uploads', name);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }



            cb(null, folderPath);
        },

        filename: (req, file, cb) => {
            const ext = file.originalname.split('.').pop().toLowerCase();
            const isValidImage = allowedImageExtensions.hasOwnProperty(ext);

            if (!isValidImage) {
                return cb(new Error('Invalid file type. Only PNG, JPEG, and WebP images are allowed.'));
            }

            const filename = `admin-${file.fieldname}-${Date.now()}.${ext}`;

            // Set the desired content type (MIME type) based on the file extension
            file.mimetype = allowedImageExtensions[ext];

            cb(null, filename);
        },
    });

    return multer({ storage: storage });
};

module.exports = generateStorage;