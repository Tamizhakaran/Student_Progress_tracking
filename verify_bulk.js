const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./server/models/User');

dotenv.config({ path: './server/.env' });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const students = await User.find({
            email: { $in: ['bulk1@bitsathy.ac.in', 'bulk2@bitsathy.ac.in'] }
        });

        console.log(`Found ${students.length} test students`);
        students.forEach(s => console.log(`- ${s.name} (${s.email})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
