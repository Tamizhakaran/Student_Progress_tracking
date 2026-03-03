const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventName: {
        type: String,
        required: true
    },
    certificationName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    },
    certificate: {
        type: String,
        required: true
    },

    adminRemark: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Achievement', achievementSchema);
