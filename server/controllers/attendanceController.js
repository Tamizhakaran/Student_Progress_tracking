const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Get all attendance records (Admin)
// @route   GET /api/attendance
// @access  Private/Admin
const getAllAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.find({})
        .populate('student', 'name email registerNumber department class')
        .sort({ date: -1 });

    res.json({
        success: true,
        data: attendance
    });
});

// @desc    Get current student attendance
// @route   GET /api/attendance/my-attendance
// @access  Private/Student
const getStudentAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.find({ student: req.user._id })
        .sort({ date: -1 });

    res.json({
        success: true,
        count: attendance.length,
        data: attendance
    });
});

// @desc    Update attendance record (Admin)
// @route   PUT /api/attendance/:id
// @access  Private/Admin
const updateAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id);

    if (attendance) {
        attendance.status = req.body.status || attendance.status;
        attendance.subject = req.body.subject || attendance.subject;
        attendance.date = req.body.date || attendance.date;

        const updatedAttendance = await attendance.save();
        res.json({
            success: true,
            data: updatedAttendance
        });
    } else {
        res.status(404);
        throw new Error('Attendance record not found');
    }
});

// @desc    Add or bulk update attendance (Admin)
// @route   POST /api/attendance/bulk
// @access  Private/Admin
const bulkUpdateAttendance = asyncHandler(async (req, res) => {
    const { records } = req.body; // Array of { studentId, date, status, subject, semester }

    const operations = records.map(record => ({
        updateOne: {
            filter: { student: record.studentId, date: record.date, subject: record.subject },
            update: { $set: record },
            upsert: true
        }
    }));

    await Attendance.bulkWrite(operations);

    res.json({
        success: true,
        message: 'Attendance records updated successfully'
    });
});

// @desc    Clear all attendance records (Admin)
// @route   DELETE /api/attendance
// @access  Private/Admin
const clearAttendance = asyncHandler(async (req, res) => {
    await Attendance.deleteMany({});
    res.json({ success: true, message: 'All attendance records cleared' });
});

// @desc    Delete single attendance record (Admin)
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
const deleteAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id);

    if (attendance) {
        await attendance.deleteOne();
        res.json({ success: true, message: 'Attendance record removed' });
    } else {
        res.status(404);
        throw new Error('Attendance record not found');
    }
});

module.exports = {
    getAllAttendance,
    getStudentAttendance,
    updateAttendance,
    bulkUpdateAttendance,
    clearAttendance,
    deleteAttendance
};
