'use strict';
const path = require('path');
const express = require('express');
const auth = require('../lib/auth');

const STATUSES = ['new', 'contacted', 'booked', 'closed'];
const views = path.join(__dirname, '..', 'views');

// Basic brute-force guard on login: 10 attempts per IP per 15 minutes.
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(ip, list);
  return list.length >= 10;
}

module.exports = function adminRoutes(db) {
  const router = express.Router();

  router.get(['/admin', '/admin/'], (req, res) => {
    if (!auth.isAuthed(req)) return res.redirect('/admin/login');
    res.set('Cache-Control', 'no-store').sendFile(path.join(views, 'admin.html'));
  });

  router.get('/admin/login', (req, res) => {
    if (auth.isAuthed(req)) return res.redirect('/admin');
    res.set('Cache-Control', 'no-store').sendFile(path.join(views, 'login.html'));
  });

  router.get('/admin/api/status', (req, res) => res.json({ configured: auth.passwordConfigured() }));

  router.post('/admin/login', (req, res) => {
    if (!auth.passwordConfigured()) return res.status(503).json({ error: 'Login is disabled until ADMIN_PASSWORD is set on the server.' });
    if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    if (!auth.checkPassword(req.body && req.body.password)) {
      attempts.get(req.ip).push(Date.now());
      return res.status(401).json({ error: 'Wrong password.' });
    }
    attempts.delete(req.ip);
    auth.setSession(req, res);
    res.json({ ok: true });
  });

  router.post('/admin/logout', (req, res) => {
    auth.clearSession(res);
    res.json({ ok: true });
  });

  router.get('/admin/api/inquiries', auth.requireAuthApi, (req, res) => {
    const rows = db.prepare('SELECT * FROM inquiries ORDER BY datetime(created_at) DESC, id DESC').all();
    res.set('Cache-Control', 'no-store').json({ inquiries: rows, statuses: STATUSES });
  });

  router.patch('/admin/api/inquiries/:id', auth.requireAuthApi, (req, res) => {
    const status = req.body && req.body.status;
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const r = db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, Number(req.params.id));
    if (!r.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });

  router.delete('/admin/api/inquiries/:id', auth.requireAuthApi, (req, res) => {
    const r = db.prepare('DELETE FROM inquiries WHERE id = ?').run(Number(req.params.id));
    if (!r.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });

  return router;
};
