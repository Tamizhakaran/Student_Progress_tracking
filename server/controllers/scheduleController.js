const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');
const User = require('../models/User');

// @desc    Upsert schedule (Admin)
// @route   POST /api/schedules
// @access  Private/Admin
const upsertSchedule = asyncHandler(async (req, res) => {
    const { department, semester, date, slots } = req.body;

    if (!department || !semester || !date || !slots) {
        res.status(400);
        throw new Error('Please provide department, semester, date, and slots');
    }

    // Normalize date to UTC midnight
    const d = new Date(date);
    const scheduleDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    console.log('Backend upsertSchedule:', {
        inputDate: date,
        normalizedUTC: scheduleDate.toISOString(),
        department,
        semester
    });

    const schedule = await Schedule.findOneAndUpdate(
        { department, semester, date: scheduleDate, adminId: req.user._id },
        { department, semester, date: scheduleDate, slots, adminId: req.user._id },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: schedule
    });
});

// @desc    Get today's schedule for student
// @route   GET /api/schedules/today
// @access  Private/Student
const getTodaySchedule = asyncHandler(async (req, res) => {
    // Normalize today to UTC midnight
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const currentUser = await User.findById(req.user.id);

    if (!currentUser || currentUser.role !== 'Student') {
        res.status(400);
        throw new Error('Not authorized or student not found');
    }

    console.log('Backend getTodaySchedule lookup:', {
        student: currentUser.name,
        dept: currentUser.department,
        sem: currentUser.semester,
        queryDateUTC: today.toISOString()
    });

    const query = {
        department: currentUser.department,
        semester: currentUser.semester,
        date: today
    };

    // Filter by student's admin
    if (currentUser.adminId) {
        query.adminId = currentUser.adminId;
    }

    const schedule = await Schedule.findOne(query);

    console.log('Backend getTodaySchedule result:', schedule ? 'Found' : 'Not Found');

    res.status(200).json({
        success: true,
        data: schedule || { slots: [] }
    });
});

// @desc    Get all schedules (Admin)
// @route   GET /api/schedules
// @access  Private/Admin
const getAllSchedules = asyncHandler(async (req, res) => {
    let query = {};
    // Each admin sees ONLY their own data
    query.adminId = req.user._id;

    const schedules = await Schedule.find(query).sort({ date: -1 });

    res.status(200).json({
        success: true,
        data: schedules
    });
});

// @desc    Delete a schedule (Admin)
// @route   DELETE /api/schedules/:id
// @access  Private/Admin
const deleteSchedule = asyncHandler(async (req, res) => {
    console.log('Backend: Deleting schedule ID:', req.params.id);
    // Admin isolation - Only the owner can delete
    if (schedule.adminId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this schedule');
    }

    await schedule.deleteOne();
    console.log('Backend: Schedule deleted successfully');

    res.status(200).json({
        success: true,
        message: 'Schedule removed'
    });
});

// @desc    Get all upcoming exams for student
// @route   GET /api/schedules/my-exams
// @access  Private/Student
const getMyExams = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || currentUser.role !== 'Student') {
        res.status(400);
        throw new Error('Not authorized or student not found');
    }

    const query = {
        department: currentUser.department,
        semester: currentUser.semester,
        'slots.type': 'Exam'
    };

    if (currentUser.adminId) {
        query.adminId = currentUser.adminId;
    }

    // Find all schedules for student's dept and sem that have 'Exam' type slots
    const schedules = await Schedule.find(query).sort({ date: 1 });

    // Flatten slots and add date
    const exams = schedules.reduce((acc, sched) => {
        const dayExams = sched.slots
            .filter(s => s.type === 'Exam')
            .map(s => ({
                ...s.toObject(),
                date: sched.date
            }));
        return [...acc, ...dayExams];
    }, []);

    res.status(200).json({
        success: true,
        data: exams
    });
});

module.exports = {
    upsertSchedule,
    getTodaySchedule,
    getAllSchedules,
    deleteSchedule,
    getMyExams
};
