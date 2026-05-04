const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  servicesRequired: {
    type: String,
    required: true,
  },
  budgetRange: {
    type: String,
    required: true,
  },
  eventVenue: {
    type: String,
    required: true,
  },
  guestCount: {
    type: String,
    required: true,
  },
  eventDate: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  referralSource: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Enquiry', EnquirySchema);
