const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Offer', 'Upcoming'],
        required: [true, 'Please specify placement type (Offer or Upcoming)']
    },
    companyName: {
        type: String,
        required: [true, 'Please add a company name']
    },
    companyUrl: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        required: [true, 'Please add a role']
    },
    department: {
        type: String,
        required: function () { return this.type === 'Offer'; }
    },
    // For Upcoming Companies
    date: {
        type: Date,
        required: function () { return this.type === 'Upcoming'; }
    },
    eligibility: {
        type: String,
        required: function () { return this.type === 'Upcoming'; }
    },
    // For Placement Offers
    studentName: {
        type: String,
        required: function () { return this.type === 'Offer'; }
    },
    salaryPackage: {
        type: String,
        required: function () { return this.type === 'Offer'; }
    },
    studentPhoto: {
        type: String,
        default: 'no-photo.jpg'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Placement', placementSchema);
