require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('📧 Testing SMTP connection...');
console.log('   From:', process.env.EMAIL_USER);
console.log('   To:  ', process.env.EMAIL_TO);
console.log('   Pass length:', process.env.EMAIL_PASSWORD?.length, 'chars');

transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ SMTP Connection FAILED:', error.message);
    console.error('   Full error:', error);
  } else {
    console.log('\n✅ SMTP Connection OK — sending test email...');
    transporter.sendMail({
      from: `"Envision Test" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: '✅ SMTP Test — Envision Enquiry System',
      html: '<h2>SMTP is working!</h2><p>This is a test email from your Envision backend.</p>',
    }, (err, info) => {
      if (err) {
        console.error('❌ Send failed:', err.message);
      } else {
        console.log('✅ Email sent! Message ID:', info.messageId);
      }
      process.exit(0);
    });
  }
});
