const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const Attendance = require('./models/Attendance');

async function inspectDB() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const total = await Attendance.countDocuments();
        const fnRecords = await Attendance.find({ slot: 'FN' }).limit(5);
        const anRecords = await Attendance.find({ slot: 'AN' }).limit(5);
        const anCount = await Attendance.countDocuments({ slot: 'AN' });

        console.log('--- DATABASE INSPECTION ---');
        console.log('Total Attendance Records:', total);
        console.log('FN Records Count:', total - anCount);
        console.log('AN Records Count:', anCount);

        console.log('\nSample FN Records:');
        fnRecords.forEach(r => console.log(`ID: ${r._id}, Student: ${r.student}, Date: ${r.date.toISOString()}, Slot: ${r.slot}, Status: ${r.status}`));

        console.log('\nSample AN Records:');
        if (anRecords.length === 0) {
            console.log('No AN records found.');
        } else {
            anRecords.forEach(r => console.log(`ID: ${r._id}, Student: ${r.student}, Date: ${r.date.toISOString()}, Slot: ${r.slot}, Status: ${r.status}`));
        }

        // Check if there are any records with case variations in 'slot'
        const allSlots = await Attendance.distinct('slot');
        console.log('\nUnique Slot values in DB:', allSlots);

        await mongoose.disconnect();
        console.log('\nDisconnected.');
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspectDB();
