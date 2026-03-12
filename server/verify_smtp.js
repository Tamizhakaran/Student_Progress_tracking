const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

transporter.verify((error, success) => {
    if (error) {
        fs.writeFileSync('test_result.txt', 'Error: ' + error.message);
        console.error('Error:', error.message);
    } else {
        fs.writeFileSync('test_result.txt', 'Success');
        console.log('Success');
    }
    process.exit(error ? 1 : 0);
});
