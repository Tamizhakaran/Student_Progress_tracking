const nodemailer = require('nodemailer');

/**
 * Send email utility that supports multiple delivery methods
 * @param {Object} options - Email options (email, subject, message)
 */
const sendEmail = async (options) => {
    const fromName = process.env.FROM_NAME || 'EduTrack X';
    const fromEmail = process.env.SMTP_EMAIL || 'onboarding@resend.dev';

    // Mode 1: SMTP (Nodemailer) - Highly recommended for custom domains/testing
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
            console.log('--- SEND_EMAIL_DIAGNOSTIC: Attempting SMTP (Nodemailer) ---');
            
            // Explicit configuration for better reliability
            const smtpConfig = {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for 587
                auth: {
                    user: process.env.SMTP_EMAIL.trim(),
                    pass: process.env.SMTP_PASSWORD.trim(),
                },
                // Add longer timeout for cloud environments
                connectionTimeout: 10000, 
                greetingTimeout: 5000,
                socketTimeout: 15000,
            };

            console.log(`Diagnostic: Connecting to ${smtpConfig.host}:${smtpConfig.port} (Secure: ${smtpConfig.secure})`);
            const transporter = nodemailer.createTransport(smtpConfig);

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: options.email,
                subject: options.subject,
                text: options.message,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Success: Email sent to ${options.email} via SMTP. ID: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`❌ SMTP Failed: ${error.message}`);
            // If Resend is available, we fall back. Otherwise we throw.
            if (!process.env.RESEND_API_KEY) {
                throw new Error(`Email delivery failed (SMTP Error: ${error.message})`);
            }
            console.log('Falling back to Resend API...');
        }
    }

    // Mode 2: Resend API (Alternative fallback)
    if (process.env.RESEND_API_KEY) {
        try {
            console.log('--- SEND_EMAIL_DIAGNOSTIC: Attempting Resend API ---');
            const apiKey = process.env.RESEND_API_KEY.trim();
            
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
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
                console.log(`✅ Success: Email sent to ${options.email} via Resend. ID: ${result.id}`);
                return true;
            } else {
                // Return descriptive error from Resend (e.g. Sandbox restriction)
                const errorMsg = result.message || 'Resend error';
                console.error(`❌ Resend Failed: ${errorMsg}`);
                throw new Error(`Email delivery failed (Resend Error: ${errorMsg})`);
            }
        } catch (error) {
            console.error(`❌ Dispatch Error: ${error.message}`);
            throw error;
        }
    }

    // Final Fallback: Missing configuration
    const configError = 'No email configuration found. Please set SMTP_EMAIL/PASS or RESEND_API_KEY.';
    console.warn(`⚠️ Warning: ${configError}`);
    throw new Error(configError);
};

module.exports = sendEmail;
