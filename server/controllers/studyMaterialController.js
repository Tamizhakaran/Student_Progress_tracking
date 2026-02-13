const StudyMaterial = require('../models/StudyMaterial');
const asyncHandler = require('express-async-handler');

// @desc    Get all study materials
// @route   GET /api/study-materials
// @access  Private
const getStudyMaterials = asyncHandler(async (req, res) => {
    let query = {};

    // Filter by department and semester if provided
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.semester = req.query.semester;
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.category) query.category = req.query.category;

    const materials = await StudyMaterial.find(query)
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: materials.length,
        data: materials
    });
});

// @desc    Create study material
// @route   POST /api/study-materials
// @access  Private/Admin
const createStudyMaterial = asyncHandler(async (req, res) => {
    const { title, description, subject, category, fileUrl, department, semester } = req.body;

    const material = await StudyMaterial.create({
        title,
        description,
        subject,
        category,
        fileUrl,
        department,
        semester,
        uploadedBy: req.user._id
    });

    res.status(201).json({
        success: true,
        data: material
    });
});

// @desc    Delete study material
// @route   DELETE /api/study-materials/:id
// @access  Private/Admin
const deleteStudyMaterial = asyncHandler(async (req, res) => {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
        res.status(404);
        throw new Error('Study material not found');
    }

    await material.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});

module.exports = {
    getStudyMaterials,
    createStudyMaterial,
    deleteStudyMaterial
};
