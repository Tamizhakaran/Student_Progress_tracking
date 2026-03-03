const dotenv = require('dotenv');
const path = require('path');
const sendEmail = require('./utils/sendEmail');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
    console.log('Starting SMTP test...');
    try {
        await sendEmail({
            email: process.env.FROM_EMAIL || 'test@example.com',
            subject: 'SMTP Test Email',
            message: 'This is a test email to verify SMTP configuration.',
        });
        console.log('SMTP test complete. Please check your inbox (or console if in fallback mode).');
    } catch (error) {
        console.error('SMTP Test Failed:', error.message);
    }
}

testEmail();
