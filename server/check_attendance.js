const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Attendance = require('./models/Attendance');
const connectDB = require('./config/db');

async function test() {
    await connectDB();

    const all = await Attendance.find({});
    const anRecords = all.filter(r => r.slot === 'AN');
    const fnRecords = all.filter(r => r.slot === 'FN');

    console.log('Total records:', all.length);
    console.log('FN records:', fnRecords.length);
    console.log('AN records:', anRecords.length);

    if (anRecords.length > 0) {
        console.log('Sample AN record:', JSON.stringify(anRecords[0], null, 2));
    } else {
        console.log('NO AN RECORDS FOUND IN DATABASE');
    }

    if (fnRecords.length > 0) {
        console.log('Sample FN record:', JSON.stringify(fnRecords[0], null, 2));
    }

    // Check all unique slots
    const uniqueSlots = [...new Set(all.map(r => r.slot))];
    console.log('Unique slots in DB:', uniqueSlots);

    process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
