const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { protect } = require('../middleware/auth');
// const { Resend } = require('resend'); // Commented out Resend
const nodemailer = require('nodemailer');

// ── SMTP Configuration ───────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to take our messages');
  }
});

// ── Resend Configuration (Commented Out) ─────────────────────
// const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helper: Build HTML email ────────────────────────────────
// ... (buildEmailHTML remains the same)
const buildEmailHTML = (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #021F10; padding: 28px 32px; text-align: center; }
    .header h1 { color: #C5A059; margin: 0; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; }
    .header p { color: #C5A059; opacity: 0.6; margin: 6px 0 0; font-size: 12px; letter-spacing: 2px; }
    .body { padding: 32px; }
    .body h2 { color: #021F10; font-size: 16px; margin-bottom: 20px; border-bottom: 2px solid #C5A059; padding-bottom: 10px; }
    .row { display: flex; margin-bottom: 14px; }
    .label { font-weight: 700; color: #555; font-size: 13px; min-width: 180px; }
    .value { color: #111; font-size: 13px; }
    .message-box { background: #f9f6ef; border-left: 3px solid #C5A059; padding: 14px 16px; margin-top: 20px; border-radius: 4px; font-size: 13px; color: #333; line-height: 1.6; }
    .footer { background: #021F10; padding: 16px 32px; text-align: center; }
    .footer p { color: #C5A059; opacity: 0.5; font-size: 11px; margin: 0; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>ENVISION</h1>
      <p>New Enquiry Received</p>
    </div>
    <div class="body">
      <h2>Client Details</h2>
      <div class="row"><span class="label">Name:</span><span class="value">${data.firstName} ${data.lastName}</span></div>
      <div class="row"><span class="label">Email:</span><span class="value">${data.email}</span></div>
      <div class="row"><span class="label">Contact Number:</span><span class="value">${data.contactNumber}</span></div>
      <div class="row"><span class="label">Services Required:</span><span class="value">${data.servicesRequired}</span></div>
      <div class="row"><span class="label">Budget Range:</span><span class="value">${data.budgetRange}</span></div>
      <div class="row"><span class="label">Event Venue:</span><span class="value">${data.eventVenue}</span></div>
      <div class="row"><span class="label">Estimated Guests:</span><span class="value">${data.guestCount}</span></div>
      <div class="row"><span class="label">Event Date:</span><span class="value">${data.eventDate}</span></div>
      <div class="row"><span class="label">Event Type:</span><span class="value">${data.eventType}</span></div>
      <div class="row"><span class="label">Where They Found Us:</span><span class="value">${data.referralSource}</span></div>
      <h2 style="margin-top:24px;">Message</h2>
      <div class="message-box">${data.message}</div>
    </div>
    <div class="footer">
      <p>ENVISION &bull; Enquiry Notification &bull; Do Not Reply</p>
    </div>
  </div>
</body>
</html>
`;

// @route   POST /api/enquiry
// @desc    Submit a new enquiry — saves to DB and sends email via SMTP
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log('📩 Received new enquiry from:', req.body.email);

    // 1. Save to MongoDB
    const newEnquiry = new Enquiry(req.body);
    await newEnquiry.save();
    console.log('✅ Enquiry saved to database');

    // 2. Send email via SMTP
    const enquiryId = newEnquiry._id.toString().slice(-6).toUpperCase();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Envision'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: req.body.email,
      subject: `[Enquiry #${enquiryId}] ${req.body.firstName} ${req.body.lastName}`,
      html: buildEmailHTML(req.body),
    };

    console.log(`📤 Attempting to send email to: ${process.env.EMAIL_TO}`);

    // Use await for sendMail to catch errors properly
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Enquiry email sent via SMTP: ${info.messageId}`);
    } catch (mailError) {
      console.error('❌ SMTP Error while sending enquiry email:', mailError);
      // We don't fail the whole request if email fails, as the enquiry is already in DB
    }

    // We return success even if email is async sending to keep UX fast
    res.status(201).json({ success: true, message: 'Enquiry submitted successfully' });
  } catch (error) {
    console.error('❌ Enquiry Submission Error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting enquiry' });
  }
});

// @route   PATCH /api/enquiry/:id/read
// @desc    Mark an enquiry as read
// @access  Private (Admin)
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: 'read' }, { new: true });
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/enquiry
// @desc    Get all enquiries
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, count: enquiries.length, enquiries });
  } catch (error) {
    console.error('Get Enquiries Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching enquiries' });
  }
});

// @route   DELETE /api/enquiry/:id
// @desc    Delete an enquiry
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    console.error('Delete Enquiry Error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting enquiry' });
  }
});

module.exports = router;
