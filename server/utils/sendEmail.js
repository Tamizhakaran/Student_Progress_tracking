const nodemailer = require('nodemailer');

/**
 * Send email utility that supports multiple delivery methods
 * @param {Object} options - Email options (email, subject, message)
 */
const sendEmail = async (options) => {
    const fromName = process.env.FROM_NAME || 'EduTrack X';
    const fromEmail = process.env.SMTP_EMAIL || 'onboarding@resend.dev';

    // Mode 1: SMTP (Nodemailer) - Port 465 SSL (verified working on Render)
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
            console.log('--- SEND_EMAIL_DIAGNOSTIC: Attempting SMTP (Nodemailer) Port 465 SSL ---');
            
            // Use Port 465 (SSL) - confirmed working via verify_smtp.js
            // Port 587 (STARTTLS) is often blocked by Render's network
            const smtpConfig = {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // SSL
                auth: {
                    user: process.env.SMTP_EMAIL.trim(),
                    pass: process.env.SMTP_PASSWORD.trim(),
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            };

            console.log(`Diagnostic: Attempting SMTP via ${smtpConfig.host}:${smtpConfig.port} (SSL: ${smtpConfig.secure})`);
            const transporter = nodemailer.createTransport(smtpConfig);

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: options.email,
                subject: options.subject,
                text: options.message,
                html: options.html || undefined,
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

    // Final Fallback: Log to console so the reset link is visible in Render logs
    console.error('--- ALL EMAIL DISPATCH METHODS FAILED ---');
    console.log(`RECIPIENT: ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    if (options.resetUrl) {
        console.log(`RESET URL (USE THIS LINK): ${options.resetUrl}`);
    }
    console.log('--- MESSAGE CONTENT START ---');
    console.log(options.message);
    console.log('--- MESSAGE CONTENT END ---');
    console.log('IMPORTANT: Please verify your SMTP credentials or Resend domain to resolve this.');
    
    // Throw so the controller knows email failed
    throw new Error('Email delivery failed. No SMTP or Resend credentials configured.');
};

module.exports = sendEmail;
