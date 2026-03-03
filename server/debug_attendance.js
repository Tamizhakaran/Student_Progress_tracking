const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');

async function debugData() {
    await mongoose.connect('mongodb://127.0.0.1:27017/edutrack_x');
    const records = await Attendance.find({}).populate('student', 'name email registerNumber');

    console.log('Attendance Records Count:', records.length);
    const institutionalSlots = new Set();
    records.forEach(r => {
        institutionalSlots.add(`${r.date.toISOString().split('T')[0]}-${r.slot}`);
    });
    console.log('Unique Institutional Slots:', institutionalSlots.size);
    console.log('Total Working Days (size * 0.5):', institutionalSlots.size * 0.5);
    console.log('Slots List:', Array.from(institutionalSlots));

    process.exit(0);
}

debugData().catch(err => {
    console.error(err);
    process.exit(1);
});
