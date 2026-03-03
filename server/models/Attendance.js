const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present'
    },
    slot: {
        type: String,
        enum: ['FN', 'AN'],
        default: 'FN'
    },
    subject: {
        type: String,
        required: false,
        default: 'General'
    },
    semester: {
        type: Number,
        required: true
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate attendance for a student on the same date and slot
attendanceSchema.index({ student: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
