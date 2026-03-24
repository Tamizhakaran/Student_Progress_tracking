const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set subdirectories - Use absolute paths to avoid issues with different CWDs
const directories = {
    certificates: path.join(__dirname, '..', 'uploads', 'certificates'),
    students: path.join(__dirname, '..', 'uploads', 'students'),
    profiles: path.join(__dirname, '..', 'uploads', 'profiles')
};

// Ensure directories exist
Object.values(directories).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = req.body.uploadType || 'certificates';
        const dest = directories[type] || directories.certificates;
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|pdf/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf';

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Images and PDFs only (jpeg/jpg/png/pdf)!'));
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
