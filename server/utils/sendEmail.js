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
            
            // Try Port 587 (TLS) first to bypass Render's common 465 timeout issues
            const smtpConfig = {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // TLS
                auth: {
                    user: process.env.SMTP_EMAIL.trim(),
                    pass: process.env.SMTP_PASSWORD.trim(),
                },
                connectionTimeout: 10000,
            };

            console.log(`Diagnostic: Attempting SMTP via ${smtpConfig.host}:${smtpConfig.port} (SSL: ${smtpConfig.secure})`);
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
            console.log('Error Details:', error); // Full error object for better debugging in Render logs
            
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

    // Final Fallback: Log to console so the user can see the reset link in Render logs
    console.error('--- ALL EMAIL DISPATCH METHODS FAILED ---');
    console.log(`RECIPIENT: ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log('--- MESSAGE CONTENT START ---');
    console.log(options.message);
    console.log('--- MESSAGE CONTENT END ---');
    console.log('IMPORTANT: Please verify your SMTP credentials or Resend domain to resolve this.');
    
    // We still throw so the frontend knows it didn't actually "send" an email,
    // but the link is now available in the server logs.
    throw new Error('Email delivery failed. The reset link has been logged to the server console for debugging.');
};

module.exports = sendEmail;
