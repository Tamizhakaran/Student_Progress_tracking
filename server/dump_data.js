const mongoose = require('mongoose');
const fs = require('fs');

async function dumpData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/edutrack_x');
        const Attendance = require('./models/Attendance');
        // No need to redefine schema

        const records = await Attendance.find({}).lean();
        const path = require('path');
        const outputPath = path.resolve('attendance_dump.json');
        fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
        console.log('Dumped', records.length, 'records to', outputPath);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpData();
