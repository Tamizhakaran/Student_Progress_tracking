const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    department: {
        type: String,
        required: [true, 'Please add a department']
    },
    semester: {
        type: String,
        required: [true, 'Please add a semester']
    },
    date: {
        type: Date,
        required: [true, 'Please add a date']
    },
    slots: [
        {
            time: {
                type: String,
                required: [true, 'Please add a time']
            },
            subject: {
                type: String,
                required: [true, 'Please add a subject']
            },
            type: {
                type: String,
                enum: ['Lecture', 'Lab', 'Seminar', 'Exam', 'Holiday'],
                default: 'Lecture'
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Normalize department to uppercase before saving
scheduleSchema.pre('save', function (next) {
    if (this.department) {
        this.department = this.department.toUpperCase();
    }
    next();
});

// Normalize department to uppercase on update/upsert
scheduleSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.department) {
        update.department = update.department.toUpperCase();
    }
    // Also normalize the filter/query department if it exists
    const query = this.getQuery();
    if (query.department) {
        query.department = query.department.toUpperCase();
    }
    next();
});

// Index for quick lookup
scheduleSchema.index({ date: 1, department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
