# FairPour Coffee Roasters: Website

Website for FairPour Coffee Roasters, a small-batch roaster and café with locations in Fairport, Ithaca and Rochester, NY.

Built by Real Easy Sites. Node/Express + SQLite, with a password-protected inquiry dashboard.

## What's on the site

- **Home page** (`public/index.html`): hero with the logo, an open-now badge, menu highlights, the FairPour story, beans and gift cards, all 3 locations with hours, phone and directions, an inquiry form for catering, wholesale and events, and an Instagram/Facebook section.
- **Online ordering and eGift cards** link out to FairPour's existing Square pages:
  - Ordering: https://fairpour1.square.site
  - eGift: https://squareup.com/gift/CNAW273BM1SJK/order
- **Inquiry dashboard** at `/admin` (password only): view, filter, set a status on (new / contacted / booked / closed) and delete every inquiry.
- SEO: per-location `CafeOrCoffeeShop` schema with hours, Open Graph/Twitter share image (the logo), and a canonical URL.

## Run locally

```bash
npm install
cp .env.example .env   # then set ADMIN_PASSWORD
npm start              # http://localhost:3000
```

## Deploy on Render

1. Create a new **Web Service** from this repo.
2. Build command: `npm install`. Start command: `npm start`. Node 20 is pinned via `.node-version` and `package.json` engines. better-sqlite3 needs Node 20.
3. Environment variables:
   | Key | Purpose |
   |---|---|
   | `ADMIN_PASSWORD` | Dashboard password, 8+ characters. Login is disabled until this is set. |
   | `SESSION_SECRET` | Long random string that keeps admins signed in across restarts. |
   | `NOTIFY_EMAIL` | Inbox that gets new-inquiry emails. |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email sender. For Gmail, use an App Password. |
   | `DB_PATH` | Optional. Point this at a persistent disk, e.g. `/var/data/fairpour.db`. |
4. **Add a persistent disk** (e.g. mount at `/var/data`) and set `DB_PATH`. Without one, saved inquiries reset on each deploy. Emails still go out either way.
5. Point the domain (fairpour.com, owned by the client) at Render.

## Folder layout

```
server.js        thin entry point
db/              SQLite setup (inquiries table)
lib/             auth (password + signed cookie), mailer
routes/          inquiry API, admin routes
views/           admin login + dashboard pages
public/          the website (html, css, js, images)
```

## Updating content

- **Hours / phones / addresses:** edit `public/index.html` (locations section, hours strip, footer) **and** the JSON-LD block in `<head>`.
- **Photos:** drop new files in `public/images/` and update the `src` in `index.html`.
