const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@bitsathy\.ac\.in$/,
            'Please add a valid @bitsathy.ac.in email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['Admin', 'Student'],
        default: 'Student'
    },
    schoolId: {
        type: String
    },
    class: {
        type: String
    },
    rollNumber: {
        type: String
    },
    registerNumber: {
        type: String
    },
    department: {
        type: String
    },
    semester: {
        type: String
    },
    batchYear: {
        type: String
    },
    profileImage: {
        type: String,
        default: 'no-photo.jpg'
    },
    cgpa: {
        type: Number,
        default: 0
    },
    semesterGrades: {
        type: [Number],
        default: [0, 0, 0, 0, 0, 0, 0, 0]
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt and normalize fields to uppercase
userSchema.pre('save', async function (next) {
    // Normalization to uppercase
    if (this.name) this.name = this.name.toUpperCase();
    if (this.registerNumber) this.registerNumber = this.registerNumber.toUpperCase();
    if (this.department) this.department = this.department.toUpperCase();

    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Normalize fields to uppercase on update
userSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.name) update.name = update.name.toUpperCase();
    if (update.registerNumber) update.registerNumber = update.registerNumber.toUpperCase();
    if (update.department) update.department = update.department.toUpperCase();
    next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    const crypto = require('crypto');
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
