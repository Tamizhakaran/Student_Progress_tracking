const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const path = require('path');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    // Convert backslashes to forward slashes for URL compatibility
    const filePath = req.file.path.replace(/\\/g, '/');
    const baseUrl = req.protocol + '://' + req.get('host');

    res.status(200).json({
        success: true,
        data: `${baseUrl}/${filePath}`,
        fileName: req.file.filename
    });
}));

module.exports = router;
