const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutrack_x';

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB at:', MONGO_URI);
        // Using 127.0.0.1 instead of localhost for better compatibility on Windows
        const uri = MONGO_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        console.log('Connected!');

        const Attendance = mongoose.model('Attendance', new mongoose.Schema({}));
        const collection = Attendance.collection;

        console.log('Fetching indexes...');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        // Look for the problematic index: { student: 1, date: 1 } unique
        const oldIndex = indexes.find(idx =>
            idx.unique &&
            Object.keys(idx.key).length === 2 &&
            idx.key.student === 1 &&
            idx.key.date === 1
        );

        if (oldIndex) {
            console.log(`Found conflicting index: ${oldIndex.name}. Dropping it...`);
            await collection.dropIndex(oldIndex.name);
            console.log('Old index dropped successfully!');
        } else {
            console.log('No conflicting old index found (student, date).');
        }

        // Ensure the correct index exists: { student: 1, date: 1, slot: 1 } unique
        const newIndex = indexes.find(idx =>
            idx.unique &&
            Object.keys(idx.key).length === 3 &&
            idx.key.student === 1 &&
            idx.key.date === 1 &&
            idx.key.slot === 1
        );

        if (!newIndex) {
            console.log('Correct composite index (student, date, slot) not found. Creating it...');
            await collection.createIndex({ student: 1, date: 1, slot: 1 }, { unique: true });
            console.log('New index created successfully!');
        } else {
            console.log('Correct composite index already exists.');
        }

        await mongoose.disconnect();
        console.log('\nDatabase maintenance complete. Please restart your server.');
        process.exit(0);
    } catch (error) {
        console.error('Maintenance failed:', error);
        process.exit(1);
    }
}

fixIndexes();
