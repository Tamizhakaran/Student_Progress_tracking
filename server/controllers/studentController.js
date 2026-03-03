const User = require('../models/User');
const Attendance = require('../models/Attendance');
const asyncHandler = require('express-async-handler');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
exports.getStudents = asyncHandler(async (req, res, next) => {
    const students = await User.find({ role: 'Student' });

    // Enhance students with attendance data using aggregation for accuracy
    const enhancedStudents = await Promise.all(students.map(async (student) => {
        try {
            // Group by date to count "days" instead of "sessions"
            const attendanceStats = await Attendance.aggregate([
                { $match: { student: student._id } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$date" }
                        },
                        sessions: {
                            $push: {
                                slot: "$slot",
                                status: "$status"
                            }
                        }
                    }
                }
            ]);

            let totalPossible = 0;
            let presentFN = 0;
            let presentAN = 0;

            attendanceStats.forEach(day => {
                day.sessions.forEach(session => {
                    totalPossible += 0.5;
                    if (['Present', 'Late'].includes(session.status)) {
                        if (session.slot === 'FN') presentFN += 1;
                        if (session.slot === 'AN') presentAN += 1;
                    }
                });
            });

            const attendancePercentage = totalPossible > 0
                ? Math.round(((presentFN * 0.5 + presentAN * 0.5) / totalPossible) * 100)
                : 100;

            const fnPercentage = (totalPossible > 0) ? Math.round((presentFN * 0.5 / totalPossible) * 200) : 100; // Simplified for display
            const anPercentage = (totalPossible > 0) ? Math.round((presentAN * 0.5 / totalPossible) * 200) : 100;

            const studentData = student.toObject();
            return {
                ...studentData,
                attendancePercentage,
                fnPercentage,
                anPercentage,
                totalClasses: totalPossible,
                semesterGrades: studentData.semesterGrades || [0, 0, 0, 0, 0, 0, 0, 0]
            };
        } catch (err) {
            console.error(`[STATS_ERROR] student ${student._id}:`, err);
            const studentData = student.toObject();
            return {
                ...studentData,
                attendancePercentage: 0,
                totalClasses: 0,
                semesterGrades: studentData.semesterGrades || [0, 0, 0, 0, 0, 0, 0, 0],
                processingError: true
            };
        }
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

    // Update student fields
    Object.keys(req.body).forEach(key => {
        student[key] = req.body[key];
    });

    await student.save();

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

    // Use provided password or fallback to register number
    const password = req.body.password || registerNumber || 'student123';

    const student = await User.create({
        name,
        email,
        password,
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
// @desc    Bulk update student details
// @route   PUT /api/students/bulk
// @access  Private/Admin
exports.bulkUpdateStudents = asyncHandler(async (req, res, next) => {
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
        res.status(400);
        throw new Error('Please provide an array of students to update');
    }

    const updatedStudents = await Promise.all(students.map(async (item) => {
        const { id, ...updateData } = item;

        // Ensure numeric fields are correctly typed if present
        if (updateData.cgpa !== undefined) {
            updateData.cgpa = Number(updateData.cgpa) || 0;
        }

        return User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    }));

    res.status(200).json({
        success: true,
        count: updatedStudents.filter(s => s !== null).length,
        data: updatedStudents
    });
});
// @desc    Bulk create student records from CSV/Array
// @route   POST /api/students/bulk-upload
// @access  Private/Admin
exports.bulkCreateStudents = asyncHandler(async (req, res, next) => {
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
        res.status(400);
        throw new Error('Please provide an array of students');
    }

    const results = {
        success: 0,
        duplicates: 0,
        errors: 0,
        failedRecords: []
    };

    const createdStudents = await Promise.all(students.map(async (studentData) => {
        try {
            const { name, email, registerNumber, department, semester, password, cgpa } = studentData;

            // Check if user already exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                results.duplicates++;
                results.failedRecords.push({ email, reason: 'User already exists' });
                return null;
            }

            const student = await User.create({
                name,
                email,
                password: password || registerNumber || 'student123',
                role: 'Student',
                registerNumber,
                department,
                semester,
                cgpa: cgpa || 0
            });

            results.success++;
            return student;
        } catch (error) {
            results.errors++;
            results.failedRecords.push({
                email: studentData.email,
                reason: error.message
            });
            return null;
        }
    }));

    res.status(201).json({
        success: true,
        summary: results,
        data: createdStudents.filter(s => s !== null)
    });
});
