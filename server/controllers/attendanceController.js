const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Get all attendance records (Admin)
// @route   GET /api/attendance
// @access  Private/Admin
const getAllAttendance = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'Student', adminId: req.user._id }).select('_id');
    const studentIds = students.map(s => s._id);

    const attendance = await Attendance.find({ student: { $in: studentIds } })
        .populate('student', 'name email registerNumber department class')
        .populate('recordedBy', 'name role')
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
        .populate('student', 'name registerNumber department class')
        .populate('recordedBy', 'name role')
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
    const attendance = await Attendance.findById(req.params.id).populate('student');
    if (!attendance) {
        res.status(404);
        throw new Error('Attendance not found');
    }

    // Check if the student belongs to this admin
    if (attendance.student.adminId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this attendance record');
    }

    attendance.status = req.body.status || attendance.status;
    if (req.body.date) {
        const dateObj = new Date(req.body.date);
        const y = dateObj.getUTCFullYear();
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        attendance.date = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
    }
    attendance.slot = req.body.slot || attendance.slot;
    attendance.recordedBy = req.user._id;

    const updatedAttendance = await attendance.save();
    res.json({
        success: true,
        data: updatedAttendance
    });
});

// @desc    Add or bulk update attendance (Admin)
// @route   POST /api/attendance/bulk
// @access  Private/Admin
const fs = require('fs');
const path = require('path');

const bulkUpdateAttendance = asyncHandler(async (req, res) => {
    const { records } = req.body;
    const logPath = path.join(__dirname, '../bulk_debug.log');

    fs.appendFileSync(logPath, `\n--- NEW BULK SUBMIT AT ${new Date().toISOString()} ---\n`);
    fs.appendFileSync(logPath, `Received ${records?.length} records.\n`);

    // Auto-fix index conflict if found
    try {
        const indexes = await Attendance.collection.indexes();
        // Look for any unique index that only includes student and date (and maybe subject) but NOT slot
        const conflict = indexes.find(i =>
            i.unique &&
            i.key.student &&
            i.key.date &&
            !i.key.slot
        );

        if (conflict) {
            console.log(`Auto-fixing index conflict: dropping ${conflict.name}`);
            await Attendance.collection.dropIndex(conflict.name);
            fs.appendFileSync(logPath, `AUTO-FIX: Dropped conflicting index ${conflict.name}\n`);
        }
    } catch (e) {
        fs.appendFileSync(logPath, `AUTO-FIX ATTEMPT: ${e.message}\n`);
    }

    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, message: 'Invalid records format' });
    }

    console.log(`\n=== BULK ATTENDANCE: Received ${records.length} records ===`);

    // Process each record individually using findOneAndUpdate for reliability
    const results = await Promise.allSettled(
        records.map(async (record, index) => {
            try {
                const studentId = record.student?._id || record.student;

                // Strict slot validation
                let slot = String(record.slot || 'FN').toUpperCase().trim();
                if (slot !== 'FN' && slot !== 'AN') slot = 'FN';

                const status = (record.status || 'Present').trim();

                // Normalize date to UTC midnight
                const dateObj = new Date(record.date);
                const y = dateObj.getUTCFullYear();
                const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getUTCDate()).padStart(2, '0');
                const utcDate = new Date(`${y}-${m}-${d}T00:00:00.000Z`);

                const saved = await Attendance.findOneAndUpdate(
                    { student: studentId, date: utcDate, slot: slot },
                    {
                        $set: {
                            student: studentId,
                            date: utcDate,
                            slot: slot,
                            status: status,
                            semester: Number(record.semester) || 1,
                            subject: record.subject || 'General',
                            recordedBy: req.user._id
                        }
                    },
                    { upsert: true, new: true, runValidators: true }
                );

                fs.appendFileSync(logPath, `  [OK] student=${studentId} slot=${slot} id=${saved._id}\n`);
                return saved;
            } catch (err) {
                const errMsg = `[SAVE_ERROR][${index}] student=${record.student}: ${err.message}`;
                console.error(errMsg);
                fs.appendFileSync(logPath, `  [ERROR] student=${record.student} slot=${record.slot}: ${err.message}\n`);
                throw err;
            }
        })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failedDetails = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason?.message || 'Unknown error');

    if (failedDetails.length > 0) {
        console.error(`=== BULK ATTENDANCE: ${failedDetails.length} records failed ===`);
    }

    res.json({
        success: failedDetails.length === 0,
        message: failedDetails.length === 0
            ? 'Attendance records updated successfully'
            : `Failed to update ${failedDetails.length} records`,
        summary: {
            succeeded,
            failed: failedDetails.length,
            total: records.length,
            errors: failedDetails.slice(0, 5) // Return first 5 errors for debugging
        }
    });
});

// @desc    Clear all attendance records for admin's students
// @route   DELETE /api/attendance
// @access  Private/Admin
const clearAttendance = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'Student', adminId: req.user._id }).select('_id');
    const studentIds = students.map(s => s._id);
    await Attendance.deleteMany({ student: { $in: studentIds } });
    res.json({ success: true, message: 'All attendance records cleared' });
});

// @desc    Delete attendance record (Admin)
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
const deleteAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id).populate('student');
    if (!attendance) {
        res.status(404);
        throw new Error('Attendance not found');
    }

    // Check if the student belongs to this admin
    if (attendance.student.adminId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this attendance record');
    }

    await attendance.deleteOne();
    res.json({ success: true, message: 'Attendance record removed' });
});

// @desc    Debug endpoint to see raw records
// @route   GET /api/attendance/debug
// @access  Private/Admin
const debugAttendance = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'Student', adminId: req.user._id }).select('_id');
    const studentIds = students.map(s => s._id);
    const rawData = await Attendance.find({ student: { $in: studentIds } }).lean();
    res.json({
        success: true,
        count: rawData.length,
        anCount: rawData.filter(r => r.slot === 'AN').length,
        fnCount: rawData.filter(r => r.slot === 'FN').length,
        data: rawData
    });
});

module.exports = {
    getAllAttendance,
    getStudentAttendance,
    updateAttendance,
    bulkUpdateAttendance,
    clearAttendance,
    deleteAttendance,
    debugAttendance
};
