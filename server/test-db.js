const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const test = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is missing!');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Database connected!');

        const userCount = await User.countDocuments();
        console.log('Total users:', userCount);

        const admin = await User.findOne({ role: 'Admin' });
        console.log('Admin found:', admin ? admin.email : 'None');

        process.exit(0);
    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

test();
