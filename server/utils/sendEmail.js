const sendEmail = async (options) => {
    // Fallback if SMTP settings are missing
    if ((!process.env.SMTP_HOST && !process.env.SMTP_SERVICE) || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log('--- EMAIL FALLBACK (Local Development) ---');
        console.log('IMPORTANT: SMTP settings are missing in .env file.');
        console.log('To send actual emails, please configure SMTP_HOST (or SMTP_SERVICE), SMTP_EMAIL, and SMTP_PASSWORD.');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        console.log('------------------------------------------');
        return;
    }

    try {
        const nodemailer = require('nodemailer');

        let transporterConfig;

        if (process.env.SMTP_SERVICE === 'gmail' || process.env.SMTP_HOST === 'smtp.gmail.com') {
            // Use explicit configuration for Gmail as it's more reliable than the 'service' shortcut
            transporterConfig = {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // use SSL
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD,
                },
            };
        } else if (process.env.SMTP_SERVICE) {
            transporterConfig = {
                service: process.env.SMTP_SERVICE,
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD,
                },
            };
        } else {
            transporterConfig = {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_PORT === '465',
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD,
                },
            };
        }

        const transporter = nodemailer.createTransport(transporterConfig);

        const message = {
            from: `${process.env.FROM_NAME || 'EduTrack X'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL || 'noreply@bitsathy.ac.in'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error(`Email Error to ${options.email}:`, error);
        console.log('--- EMAIL CONFIG DIAGNOSTIC ---');
        console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
        console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
        console.log('FROM_NAME:', process.env.FROM_NAME);
        console.log('-------------------------------');
        throw error;
    }
};

module.exports = sendEmail;
