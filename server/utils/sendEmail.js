const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const fromName = process.env.FROM_NAME || 'EduTrack X';
    const fromEmail = process.env.SMTP_EMAIL || 'onboarding@resend.dev';

    // Mode 1: SMTP (Nodemailer) - Prioritize if credentials exist
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
            console.log('--- SEND_EMAIL_VERSION: 8 (SMTP/Nodemailer) ---');
            
            const transporter = nodemailer.createTransport({
                service: process.env.SMTP_SERVICE || 'gmail',
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: options.email,
                subject: options.subject,
                text: options.message,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Email successfully sent to ${options.email} via SMTP. ID: ${info.messageId}`);
            return;
        } catch (error) {
            console.error(`SMTP Error to ${options.email}:`, error.message);
            console.log('Falling back to Resend API if available...');
        }
    }

    // Mode 2: Resend API
    if (process.env.RESEND_API_KEY) {
        try {
            console.log('--- SEND_EMAIL_VERSION: 8 (Resend API) ---');
            
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                },
                body: JSON.stringify({
                    from: `"${fromName}" <onboarding@resend.dev>`,
                    to: options.email.toLowerCase(),
                    subject: options.subject,
                    text: options.message,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log(`Email successfully sent to ${options.email} via Resend. ID: ${result.id}`);
                return;
            } else {
                console.error('Resend API Error:', result);
                throw new Error(result.message || 'Failed to send email via Resend');
            }
        } catch (error) {
            console.error(`Resend Error to ${options.email}:`, error.message);
            throw error;
        }
    }

    // Fallback if no method is configured
    console.warn('--- EMAIL NOT SENT (No Configuration Found) ---');
    console.log('Please provide either SMTP_EMAIL/SMTP_PASSWORD or RESEND_API_KEY in .env');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('------------------------------------------');
};

module.exports = sendEmail;
