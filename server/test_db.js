const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Placement = require('./models/Placement'); // Wait, does this model exist? Let's check!
        const placements = await Placement.find().limit(2);
        console.log("Placements:", JSON.stringify(placements, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
check();
