const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const System = require('../models/System');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, schoolId, class: studentClass, rollNumber, registerNumber, department, semester, batchYear } = req.body;

    // Strict security: Only allow Admin registration via this endpoint
    // Student registration must be handled by an Admin via the Student Management module
    if (role !== 'Admin') {
        res.status(403);
        throw new Error('Only Administrator registration is allowed via this path.');
    }

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Handle role restrictions: Only Super Admin can create other admins ideally, 
    // but for initial setup we might allow it or use a seed script.
    // Enhanced security: Validate admin access code
    if (role === 'Admin') {
        const adminCode = req.body.schoolId?.trim().replace(/^["']|["']$/g, '').toUpperCase();
        // Fallback to BIT-ADM-2026 if env var is missing, also strip quotes
        const rawExpected = process.env.ADMIN_ACCESS_CODE || 'BIT-ADM-2026';
        const expectedCode = rawExpected.trim().replace(/^["']|["']$/g, '').toUpperCase();
        
        if (adminCode !== expectedCode) {
            console.error(`Admin Code Mismatch: Got "${adminCode}", Expected "${expectedCode}"`);
            res.status(401);
            throw new Error('Invalid Admin Access Code. Please check the documentation.');
        }
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'Student',
        schoolId,
        class: studentClass,
        rollNumber,
        registerNumber,
        department,
        semester,
        batchYear
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            registerNumber: user.registerNumber,
            department: user.department,
            semester: user.semester,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    try {
        console.log('Login attempt:', req.body.email);
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Please provide email and password');
        }

        // Check for user email (normalized to lowercase)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            console.warn(`Login failed: [USER_NOT_FOUND] email: ${email}`);
            res.status(401);
            throw new Error('Invalid credentials');
        }

        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            console.log(`Login successful: [SUCCESS] email: ${email}, role: ${user.role}`);
            const system = await System.findOne();
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                profileImage: user.profileImage,
                schoolId: user.schoolId,
                registerNumber: user.registerNumber,
                department: user.department,
                semester: user.semester,
                cgpa: user.cgpa,
                semesterGrades: user.semesterGrades || [0, 0, 0, 0, 0, 0, 0, 0],
                isMaintenanceMode: system?.isMaintenanceMode || false
            });
        } else {
            console.warn(`Login failed: [INCORRECT_PASSWORD] email: ${email}`);
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        console.error('Login Error:', error);
        throw error;
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    console.log('GetMe request for user ID:', req.user?.id);
    const user = await User.findById(req.user.id);

    if (!user) {
        console.error('User not found in GetMe');
        res.status(404);
        throw new Error('User not found');
    }

    const system = await System.findOne();

    res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        class: user.class,
        batchYear: user.batchYear,
        cgpa: user.cgpa,
        department: user.department,
        semester: user.semester,
        registerNumber: user.registerNumber,
        profileImage: user.profileImage,
        semesterGrades: user.semesterGrades || [0, 0, 0, 0, 0, 0, 0, 0],
        isMaintenanceMode: system?.isMaintenanceMode || false
    });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(404);
        throw new Error('There is no user with that email');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        const sendEmail = require('../utils/sendEmail');
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message,
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const crypto = require('crypto');
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(201).json({
        success: true,
        token: generateToken(user._id),
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
};
