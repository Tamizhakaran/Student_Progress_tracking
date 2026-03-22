require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Fee = require('./models/Fee');
const Mark = require('./models/Mark');
const Leave = require('./models/Leave');
const Achievement = require('./models/Achievement');

const ORIGINAL_ADMIN_ID = '69c00909e4dfeae10c570cbd'; // Kaviya K ObjectId

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');
        
        // 1. Assign orphaned students to the original admin
        console.log('Finding legacy students without adminId...');
        const result = await User.updateMany(
            { role: 'Student', adminId: null }, // or { adminId: { $exists: false } }
            { $set: { adminId: ORIGINAL_ADMIN_ID } }
        );
        console.log(`Updated legacy students with missing/null adminId: ${result.modifiedCount}`);

        const result2 = await User.updateMany(
            { role: 'Student', adminId: { $exists: false } },
            { $set: { adminId: ORIGINAL_ADMIN_ID } }
        );
        console.log(`Updated legacy students without adminId field at all: ${result2.modifiedCount}`);

        console.log('Migration complete. Old students now belong to the original Admin!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

runMigration();
