'use strict';
// FairPour Coffee Roasters: thin entry point. Logic lives in lib/ and routes/.
const path = require('path');
const fs = require('fs');

// Minimal .env loader (no dependency) for local dev.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const express = require('express');
const db = require('./db');
const adminRoutes = require('./routes/admin');
const inquiryRoutes = require('./routes/inquiry');
const facebookRoutes = require('./routes/facebook');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Admin first, so /admin always asks for the password before anything static is served.
app.use(adminRoutes(db));
app.use('/api/inquiry', inquiryRoutes(db));
app.use('/api/facebook-feed', facebookRoutes());

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '7d', index: 'index.html' }));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FairPour site running on http://localhost:${PORT}`));
