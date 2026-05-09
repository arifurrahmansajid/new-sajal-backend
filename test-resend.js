require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
  console.log('Testing Resend with API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  console.log('Sending to:', process.env.EMAIL_TO);

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Envision Test <onboarding@resend.dev>',
      to: process.env.EMAIL_TO,
      subject: 'Resend Test Connection',
      html: '<h1>If you see this, Resend is working!</h1>',
    });

    if (error) {
      console.error('❌ Resend Error:', error);
    } else {
      console.log('✅ Success! Email sent ID:', data.id);
    }
  } catch (err) {
    console.error('❌ Unexpected Error:', err.message);
  }
}

testResend();
