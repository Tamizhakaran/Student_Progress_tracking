const sendEmail = async (options) => {
    // Version 7: Using Resend API (HTTP Port 443) to bypass Render port blocking
    // Fallback if RESEND_API_KEY is missing
    if (!process.env.RESEND_API_KEY) {
        console.log('--- EMAIL FALLBACK (Local Development) ---');
        console.log('IMPORTANT: RESEND_API_KEY is missing in .env file.');
        console.log('To send actual emails, please get an API key from resend.com.');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        console.log('------------------------------------------');
        return;
    }

    try {
        console.log('--- SEND_EMAIL_VERSION: 7 (Resend API) ---');
        
        // Use native fetch (Available in Node.js 18+)
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
            },
            body: JSON.stringify({
                from: `${process.env.FROM_NAME || 'EduTrack X'} <onboarding@resend.dev>`, // Resend free tier requires this verified domain
                to: options.email.toLowerCase(),
                subject: options.subject,
                text: options.message,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`Email successfully sent to ${options.email} via Resend. ID: ${result.id}`);
        } else {
            console.error('Resend API Error:', result);
            throw new Error(result.message || 'Failed to send email via Resend');
        }
    } catch (error) {
        console.error(`Email Error to ${options.email}:`, error.message);
        console.log('--- EMAIL CONFIG DIAGNOSTIC ---');
        console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '****' + process.env.RESEND_API_KEY.slice(-4) : 'MISSING');
        console.log('FROM_NAME:', process.env.FROM_NAME);
        console.log('RECIPIENT:', options.email);
        console.log('-------------------------------');
        throw error;
    }
};

module.exports = sendEmail;
