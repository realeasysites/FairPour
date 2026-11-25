'use strict';
const express = require('express');
const { notifyInquiry } = require('../lib/mailer');

const TOPICS = ['Catering & large orders', 'Wholesale coffee', 'Events & meetups', 'General question', 'Feedback'];
const LOCATIONS = ['Fairport', 'Ithaca', 'Rochester', 'Any / not sure'];

// Simple in-memory rate limit: 5 submissions per IP per 10 minutes.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

module.exports = function inquiryRoutes(db) {
  const router = express.Router();
  const insert = db.prepare(`INSERT INTO inquiries (name, email, phone, location, topic, event_date, headcount, message)
                             VALUES (@name, @email, @phone, @location, @topic, @event_date, @headcount, @message)`);

  router.post('/', async (req, res) => {
    const b = req.body || {};
    // Honeypot: real visitors never fill this hidden field.
    if (b.website) return res.json({ ok: true });
    if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many submissions. Please try again in a few minutes.' });

    const inq = {
      name: clip(b.name, 100),
      email: clip(b.email, 150),
      phone: clip(b.phone, 30),
      location: LOCATIONS.includes(b.location) ? b.location : '',
      topic: TOPICS.includes(b.topic) ? b.topic : 'General question',
      event_date: clip(b.event_date, 20),
      headcount: clip(b.headcount, 20),
      message: clip(b.message, 3000),
    };
    if (!inq.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inq.email) || !inq.message) {
      return res.status(400).json({ error: 'Please add your name, a valid email and a message.' });
    }

    insert.run(inq);
    notifyInquiry(inq).catch((err) => console.error('[mailer] send failed:', err.message));
    res.json({ ok: true });
  });

  return router;
};
