const Fee = require('../models/Fee');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private/Admin
exports.getFees = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'Student', adminId: req.user._id }).select('name registerNumber email department semester');
    const studentIds = students.map(s => s._id);
    const fees = await Fee.find({ student: { $in: studentIds } }).populate('student', 'name registerNumber email department semester');

    const data = students.map(student => {
        const studentFee = fees.find(f => f.student && f.student._id.toString() === student._id.toString());
        if (studentFee) {
            return studentFee;
        }
        return {
            _id: `temp-${student._id}`,
            student,
            totalAmount: 0,
            paidAmount: 0,
            dueDate: new Date(),
            category: 'Tuition',
            academicYear: '2025-2026',
            status: 'Pending',
            isPlaceholder: true
        };
    });

    res.status(200).json({
        success: true,
        count: data.length,
        data: data
    });
});

// @desc    Get current student's fees
// @route   GET /api/fees/myfees
// @access  Private
exports.getStudentFees = asyncHandler(async (req, res) => {
    const fees = await Fee.find({ student: req.user.id });
    res.status(200).json({
        success: true,
        count: fees.length,
        data: fees
    });
});

// @desc    Create new fee record
// @route   POST /api/fees
// @access  Private/Admin
exports.createFee = asyncHandler(async (req, res) => {
    const { studentEmail, totalAmount, paidAmount, dueDate, category, academicYear, notes } = req.body;

    const student = await User.findOne({ email: studentEmail, adminId: req.user._id });
    if (!student) {
        res.status(404);
        throw new Error('Student not found with this email or you are not authorized');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    let status = 'Pending';
    if (totalAmount > 0 && Number(paidAmount || 0) >= Number(totalAmount)) {
        status = 'Paid';
    } else if (due < today) {
        status = 'Overdue';
    }

    const fee = await Fee.create({
        student: student._id,
        totalAmount,
        paidAmount: paidAmount || 0,
        dueDate,
        status,
        category,
        academicYear,
        notes
    });

    res.status(201).json({
        success: true,
        data: fee
    });
});

// @desc    Update fee record
// @route   PUT /api/fees/:id
// @access  Private/Admin
exports.updateFee = asyncHandler(async (req, res) => {
    let fee = await Fee.findById(req.params.id).populate('student');

    if (!fee) {
        res.status(404);
        throw new Error(`Fee record not found with id of ${req.params.id}`);
    }

    // Check if student belongs to this admin
    if (fee.student.adminId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this fee record');
    }

    fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // Auto update status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(fee.dueDate);
    due.setHours(0, 0, 0, 0);

    if (fee.paidAmount >= fee.totalAmount && fee.totalAmount > 0) {
        fee.status = 'Paid';
    } else if (due < today) {
        fee.status = 'Overdue';
    } else {
        fee.status = 'Pending';
    }
    await fee.save();

    res.status(200).json({
        success: true,
        data: fee
    });
});

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private/Admin
exports.deleteFee = asyncHandler(async (req, res) => {
    const fee = await Fee.findById(req.params.id).populate('student');

    if (!fee) {
        res.status(404);
        throw new Error(`Fee record not found with id of ${req.params.id}`);
    }

    // Check if student belongs to this admin
    if (fee.student.adminId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this fee record');
    }

    await Fee.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Bulk update/create fee records
// @route   PUT /api/fees/bulk
// @access  Private/Admin
exports.bulkUpdateFees = asyncHandler(async (req, res) => {
    const { fees } = req.body;

    if (!fees || !Array.isArray(fees)) {
        res.status(400);
        throw new Error('Please provide an array of fees to update');
    }

    const results = await Promise.all(fees.map(async (feeData) => {
        const { _id, isPlaceholder, student, ...data } = feeData;

        // Ensure due date is a valid date object if present
        if (data.dueDate) data.dueDate = new Date(data.dueDate);

        if (isPlaceholder || (_id && _id.toString().startsWith('temp-'))) {
            // Create
            const studentId = student?._id || student;
            const studentUser = await User.findOne({ _id: studentId, adminId: req.user._id });
            if (!studentUser) return null;

            const totalAmount = Number(data.totalAmount) || 0;
            const paidAmount = Number(data.paidAmount) || 0;
            const dueDate = data.dueDate || new Date();

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(dueDate);
            due.setHours(0, 0, 0, 0);

            let status = 'Pending';
            if (totalAmount > 0 && paidAmount >= totalAmount) {
                status = 'Paid';
            } else if (due < today) {
                status = 'Overdue';
            }

            return Fee.create({
                student: studentUser._id,
                totalAmount,
                paidAmount,
                dueDate,
                status,
                category: data.category || 'Tuition',
                academicYear: data.academicYear || '2025-2026',
                notes: data.notes || ''
            });
        } else {
            // Update
            let fee = await Fee.findById(_id).populate('student');
            if (!fee || fee.student.adminId.toString() !== req.user._id.toString()) return null;

            // Ensure numbers are handled correctly
            if (data.totalAmount !== undefined) data.totalAmount = Number(data.totalAmount);
            if (data.paidAmount !== undefined) data.paidAmount = Number(data.paidAmount);

            fee = await Fee.findByIdAndUpdate(_id, data, {
                new: true,
                runValidators: true
            });

            // Auto update status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(fee.dueDate);
            due.setHours(0, 0, 0, 0);

            if (fee.paidAmount >= fee.totalAmount && fee.totalAmount > 0) {
                fee.status = 'Paid';
            } else if (due < today) {
                fee.status = 'Overdue';
            } else {
                fee.status = 'Pending';
            }
            await fee.save();
            return fee;
        }
    }));

    res.status(200).json({
        success: true,
        count: results.filter(r => r !== null).length,
        data: results.filter(r => r !== null)
    });
});
