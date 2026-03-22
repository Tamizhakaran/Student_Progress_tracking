require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const NEW_CORRECT_ADMIN_ID = '69bf7992926648c13dc2934b'; // admin@bitsathy.ac.in

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');
        
        console.log('Transferring all students to the primary admin account...');
        const result = await User.updateMany(
            { role: 'Student' }, 
            { $set: { adminId: NEW_CORRECT_ADMIN_ID } }
        );
        console.log(`Updated all students to belong to Admin (admin@bitsathy.ac.in). Count: ${result.modifiedCount}`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

runMigration();
