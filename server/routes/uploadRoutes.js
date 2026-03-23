const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    try {
        // Convert to Base64 to prevent data loss on ephemeral file systems (like Render)
        const fileData = fs.readFileSync(req.file.path);
        const base64String = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;

        // Delete the temporary file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            data: base64String,
            fileName: req.file.filename
        });
    } catch (error) {
        res.status(500);
        throw new Error('Error processing uploaded file');
    }
}));

module.exports = router;
