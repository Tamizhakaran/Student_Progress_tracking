const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Achievement = require('./models/Achievement');

const dump = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const achievements = await Achievement.find().limit(5).populate('student', 'name');
        console.log('Last 5 achievements:');
        achievements.forEach(a => {
            console.log(`ID: ${a._id}`);
            console.log(`Student: ${a.student?.name}`);
            console.log(`Certificate Path: ${a.certificate}`);
            console.log('---');
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dump();
