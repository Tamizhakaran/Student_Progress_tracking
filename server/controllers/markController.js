const asyncHandler = require('express-async-handler');
const Mark = require('../models/Mark');

// @desc    Add or update marks for a student
// @route   POST /api/marks
// @access  Private/Admin
const upsertMark = asyncHandler(async (req, res) => {
    const { studentId, subject, score, semester } = req.body;

    if (!studentId || !subject || score === undefined || !semester) {
        res.status(400);
        throw new Error('Please provide studentId, subject, score, and semester');
    }

    const mark = await Mark.findOneAndUpdate(
        { student: studentId, subject, semester: semester.toString() },
        { score },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: mark
    });
});

// @desc    Get marks for a specific student
// @route   GET /api/marks/student/:studentId
// @access  Private/Admin
const getStudentMarks = asyncHandler(async (req, res) => {
    const marks = await Mark.find({ student: req.params.studentId });

    res.status(200).json({
        success: true,
        data: marks
    });
});

// @desc    Get my marks (Student)
// @route   GET /api/marks/my-marks
// @access  Private/Student
const getMyMarks = asyncHandler(async (req, res) => {
    const marks = await Mark.find({ student: req.user.id });

    res.status(200).json({
        success: true,
        data: marks
    });
});

// @desc    Delete a mark
// @route   DELETE /api/marks/:id
// @access  Private/Admin
const deleteMark = asyncHandler(async (req, res) => {
    const mark = await Mark.findById(req.params.id);

    if (!mark) {
        res.status(404);
        throw new Error('Mark not found');
    }

    await mark.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

module.exports = {
    upsertMark,
    getStudentMarks,
    getMyMarks,
    deleteMark
};
