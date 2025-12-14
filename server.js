const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Use App Password, not Gmail password
  },
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Email API is running', status: 'ok' });
});

// POST endpoint for sending mail
app.post('/sendmail', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, product_interest, message } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !product_interest || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: first_name, last_name, email, phone, product_interest, message',
      });
    }

    // Compose email body
    const emailBody = `
First Name: ${first_name}
Last Name: ${last_name}
Email: ${email}
Phone: ${phone}
Product Interest: ${product_interest}

Message:
${message}
    `;

    // Send email
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Receive at same address
      subject: 'New Website Inquiry',
      text: emailBody,
    });

    console.log('Email sent:', info.messageId);
    return res.status(200).json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
// Start server only when run directly (not when required by serverless handlers)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Email API server running on http://localhost:${PORT}`);
    console.log(`Send POST requests to http://localhost:${PORT}/sendmail`);
  });
}

module.exports = app;
