const Leave = require('../models/Leave');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Student)
const applyLeave = asyncHandler(async (req, res) => {
    const { fromDate, toDate, fromTime, toTime, reason } = req.body;

    const leave = await Leave.create({
        student: req.user._id,
        fromDate,
        toDate,
        fromTime,
        toTime,
        reason
    });

    res.status(201).json({
        success: true,
        data: leave
    });
});

// @desc    Get student's leave history
// @route   GET /api/leaves/my
// @access  Private (Student)
const getMyLeaves = asyncHandler(async (req, res) => {
    const leaves = await Leave.find({ student: req.user._id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: leaves.length,
        data: leaves
    });
});

// @desc    Get all leave requests
// @route   GET /api/leaves/admin/all
// @access  Private (Admin)
const getAllLeaves = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'Student', adminId: req.user._id }).select('_id');
    const studentIds = students.map(s => s._id);

    const leaves = await Leave.find({ student: { $in: studentIds } })
        .populate('student', 'name registerNumber department')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: leaves.length,
        data: leaves
    });
});

// @desc    Update leave status
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin)
const updateLeaveStatus = asyncHandler(async (req, res) => {
    const { status, adminRemark } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        {
            status,
            adminRemark: adminRemark || '',
            approvedBy: req.user._id
        },
        { new: true }
    );

    if (!leave) {
        res.status(404);
        throw new Error('Leave request not found');
    }

    res.status(200).json({
        success: true,
        data: leave
    });
});

module.exports = {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus
};
