require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function test() {
    try {
        await sendEmail({
            email: 'tamizhakaran10@gmail.com', // testing self-send
            subject: 'Test Email',
            message: 'This is a test'
        });
        console.log('Test email sent successfully');
        process.exit(0);
    } catch (err) {
        console.error('Test email failed:', err);
        process.exit(1);
    }
}
test();
