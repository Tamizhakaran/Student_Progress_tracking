const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: [true, 'Please add total amount']
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date,
        required: [true, 'Please add a due date']
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Overdue'],
        default: 'Pending'
    },
    category: {
        type: String,
        enum: ['Tuition', 'Hostel', 'Exam', 'Other'],
        required: [true, 'Please select a category']
    },
    academicYear: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);
