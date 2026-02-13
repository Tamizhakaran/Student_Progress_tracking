const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject name']
    },
    score: {
        type: Number,
        required: [true, 'Please add a score'],
        min: 0,
        max: 100
    },
    semester: {
        type: String,
        required: [true, 'Please add a semester']
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for quick lookup
markSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
