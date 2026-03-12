require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function test() {
    try {
        await sendEmail({
            email: 'tamizhakaran.me23@bitsathy.ac.in', // Sending to self for testing
            subject: 'Test Email from EduTrack X',
            message: 'This is a test email after fixing sendEmail.js. If you receive this, the email sending functionality is working.',
        });
        console.log('Test email sent successfully');
    } catch (error) {
        console.error('Test email failed', error);
    }
}

test();
