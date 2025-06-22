const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const nodemailer = require('nodemailer');

const otpStore = {};
const usersPath = path.join(__dirname, '../data/users.json');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.OTP_EMAIL,
    pass: process.env.OTP_PASSWORD,
  },
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: `"FinBot Security" <${process.env.OTP_EMAIL}>`,
      to: email,
      subject: 'Your FinBot OTP Code',
      html: `<h3>Your OTP is:</h3><p><strong>${otp}</strong></p>`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


router.post('/verify-otp', async (req, res) => {
  const { email, otp, password } = req.body;
  if (otpStore[email] !== otp) return res.json({ success: false });

  delete otpStore[email];
  let users = [];

  try {
    const rawData = fs.readFileSync(usersPath);
    users = JSON.parse(rawData);
  } catch (err) {
    console.error('Read error:', err.message);
  }

  const existingUser = users.find(u => u.email === email);
  if (!existingUser) {
    users.push({ email, password });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return res.json({ success: true, newUser: true });
  }

  if (existingUser.password !== password) {
    return res.status(401).json({ success: false, error: 'Wrong password' });
  }

  res.json({ success: true });
});
