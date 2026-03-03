const Subject = require('../models/Subject');
const asyncHandler = require('express-async-handler');

// @desc    Get all subjects or filter by semester/department
// @route   GET /api/subjects
// @access  Private/Admin
const getSubjects = asyncHandler(async (req, res) => {
    const { semester, department } = req.query;
    const query = {};
    if (semester) query.semester = Number(semester);
    if (department) {
        // Use a case-insensitive regex for department matching
        query.department = { $regex: new RegExp(`^${department}$`, 'i') };
    }

    const subjects = await Subject.find(query).sort({ semester: 1, name: 1 });

    res.json({
        success: true,
        count: subjects.length,
        data: subjects
    });
});

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = asyncHandler(async (req, res) => {
    const { name, code, semester, department } = req.body;

    const subject = await Subject.create({
        name,
        code,
        semester: Number(semester),
        department,
        createdBy: req.user._id
    });

    res.status(201).json({
        success: true,
        data: subject
    });
});

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = asyncHandler(async (req, res) => {
    let subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: subject
    });
});

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    await subject.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});

// @desc    Bulk create subjects (for initialization)
// @route   POST /api/subjects/bulk
// @access  Private/Admin
const bulkCreateSubjects = asyncHandler(async (req, res) => {
    const { subjects } = req.body;

    if (!subjects || !Array.isArray(subjects)) {
        res.status(400);
        throw new Error('Invalid subjects format');
    }

    const results = await Subject.insertMany(subjects, { ordered: false }).catch(err => {
        // Return results even if some duplicates occurred
        return err.insertedDocs;
    });

    res.status(201).json({
        success: true,
        count: Array.isArray(results) ? results.length : 0,
        message: 'Bulk creation attempted'
    });
});

module.exports = {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    bulkCreateSubjects
};
