const sendEmail = async (options) => {
    // Fallback if SMTP settings are missing
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log('--- EMAIL FALLBACK (Local Development) ---');
        console.log('IMPORTANT: SMTP settings are missing in .env file.');
        console.log('To send actual emails, please configure SMTP_HOST, SMTP_EMAIL, and SMTP_PASSWORD.');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        console.log('------------------------------------------');
        return;
    }

    try {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const message = {
            from: `${process.env.FROM_NAME || 'EduTrack X'} <${process.env.FROM_EMAIL || 'noreply@bitsathy.ac.in'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Email Error:', error.message);
        // Still log to console so the link isn't lost
        console.log('--- EMAIL CONTENT (Failed to send via SMTP) ---');
        console.log('To:', options.email);
        console.log('Message:', options.message);
        console.log('-----------------------------------------------');
    }
};

module.exports = sendEmail;
