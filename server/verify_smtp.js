require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConfig(name, config) {
    console.log(`\n--- Testing Config: ${name} ---`);
    console.log(`Host: ${config.host || 'default'}, Port: ${config.port || 'default'}, Secure: ${config.secure}`);
    const transporter = nodemailer.createTransport(config);
    try {
        await transporter.verify();
        console.log(`✅ ${name}: Connection Success!`);

        const info = await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL,
            subject: `Test Email - ${name}`,
            text: `This is a test email using ${name} configuration.`
        });
        console.log(`📩 ${name}: Email Sent! MessageID: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ ${name}: Failed! Error: ${error.message}`);
    }
}

async function runDiagnostics() {
    const email = process.env.SMTP_EMAIL;
    const pass = process.env.SMTP_PASSWORD;

    if (!email || !pass) {
        console.error("Error: SMTP_EMAIL or SMTP_PASSWORD missing in .env");
        return;
    }

    console.log(`Diagnostic Start: Testing for ${email}`);

    // Config 1: Explicit Gmail Port 465 (SSL)
    await testConfig("Gmail Port 465 (SSL)", {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: email, pass: pass }
    });

    // Config 2: Explicit Gmail Port 587 (STARTTLS)
    await testConfig("Gmail Port 587 (TLS)", {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: { user: email, pass: pass }
    });

    // Config 3: Gmail 'service' shortcut
    await testConfig("Gmail Service Shortcut", {
        service: 'gmail',
        auth: { user: email, pass: pass }
    });
}

runDiagnostics();
