const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkIndexes() {
    try {
        console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
        // Using 127.0.0.1 for more reliable local connection on Windows
        const uri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        console.log('Connected!');

        const Attendance = mongoose.model('Attendance', new mongoose.Schema({}));
        const indexes = await Attendance.collection.indexes();

        console.log('--- ATTENDANCE INDEXES ---');
        console.log(JSON.stringify(indexes, null, 2));

        await mongoose.disconnect();
        console.log('\nDisconnected.');
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

checkIndexes();
