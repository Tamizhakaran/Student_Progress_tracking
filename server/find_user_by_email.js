require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function findUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'tamizhakaran.me23@bitsathy.ac.in';
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            console.log('USER_FOUND:', JSON.stringify({ email: user.email, id: user._id }));
        } else {
            console.log('USER_NOT_FOUND:', email);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
findUser();
