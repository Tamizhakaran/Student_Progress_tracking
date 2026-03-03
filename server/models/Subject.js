const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a subject name'],
        trim: true
    },
    code: {
        type: String,
        required: false,
        trim: true
    },
    semester: {
        type: Number,
        required: [true, 'Please add a semester (1-8)'],
        min: 1,
        max: 8
    },
    department: {
        type: String,
        required: [true, 'Please add a department'],
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

// Prevent duplicate subject names in the same department and semester
subjectSchema.index({ name: 1, department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
