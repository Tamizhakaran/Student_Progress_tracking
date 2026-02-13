const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const colors = require('colors'); // Removed missing dependency
const User = require('./models/User');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const users = [
            {
                name: 'System Admin',
                email: 'admin@bitsathy.ac.in',
                password: 'admin123',
                role: 'Admin',
            }
        ];

        await User.create(users);

        console.log('Data Imported...');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();

        console.log('Data Destroyed...');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
