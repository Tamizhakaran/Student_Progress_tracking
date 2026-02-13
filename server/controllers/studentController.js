const User = require('../models/User');
const Attendance = require('../models/Attendance');
const asyncHandler = require('express-async-handler');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
exports.getStudents = asyncHandler(async (req, res, next) => {
    const students = await User.find({ role: 'Student' });

    // Enhance students with attendance data
    const enhancedStudents = await Promise.all(students.map(async (student) => {
        const totalAttendance = await Attendance.countDocuments({ student: student._id });
        const presentAttendance = await Attendance.countDocuments({
            student: student._id,
            status: { $in: ['Present', 'Late'] }
        });

        const attendancePercentage = totalAttendance > 0
            ? Math.round((presentAttendance / totalAttendance) * 100)
            : 0;

        return {
            ...student._doc,
            attendancePercentage,
            totalClasses: totalAttendance
        };
    }));

    res.status(200).json({
        success: true,
        count: enhancedStudents.length,
        data: enhancedStudents
    });
});

// @desc    Get top performers (public for all authenticated users)
// @route   GET /api/students/top-performers
// @access  Private (all authenticated users)
exports.getTopPerformers = asyncHandler(async (req, res, next) => {
    const students = await User.find({ role: 'Student' })
        .select('name email department cgpa registerNumber')
        .sort({ cgpa: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        count: students.length,
        data: students
    });
});

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = asyncHandler(async (req, res, next) => {
    let student = await User.findById(req.params.id);

    if (!student) {
        res.status(404);
        throw new Error(`Student not found with id of ${req.params.id}`);
    }

    // Make sure user is a student
    if (student.role !== 'Student') {
        res.status(400);
        throw new Error(`User with id ${req.params.id} is not a student`);
    }

    student = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: student
    });
});

// @desc    Create student record
// @route   POST /api/students
// @access  Private/Admin
exports.createStudent = asyncHandler(async (req, res, next) => {
    const { name, email, registerNumber, department, semester, cgpa } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Auto-generate password from register number (default: registerNumber or 'student123')
    const defaultPassword = registerNumber || 'student123';

    const student = await User.create({
        name,
        email,
        password: defaultPassword,
        role: 'Student',
        registerNumber,
        department,
        semester,
        cgpa: cgpa || 0
    });

    res.status(201).json({
        success: true,
        data: student
    });
});

// @desc    Delete student record
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = asyncHandler(async (req, res, next) => {
    const student = await User.findById(req.params.id);

    if (!student) {
        res.status(404);
        throw new Error(`Student not found with id of ${req.params.id}`);
    }

    if (student.role !== 'Student') {
        res.status(400);
        throw new Error('Cannot delete non-student accounts via this endpoint');
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get current student rank
// @route   GET /api/students/rank
// @access  Private (Student)
exports.getStudentRank = asyncHandler(async (req, res, next) => {
    // Determine the user ID (from token)
    // Find all students sorted by CGPA desc
    // Find index of current user

    // Optimized: Count students with higher CGPA than current user
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || currentUser.role !== 'Student') {
        res.status(400);
        throw new Error('Not a student or user not found');
    }

    const higherRankCount = await User.countDocuments({
        role: 'Student',
        cgpa: { $gt: currentUser.cgpa || 0 }
    });

    // Rank is count of people with higher CGPA + 1
    // Ties are handled by giving them the same rank (e.g. if two people have top score, they are both rank 1)
    const rank = higherRankCount + 1;

    res.status(200).json({
        success: true,
        rank
    });
});
