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

## Facebook feed ("What's Brewing" section)

Whatever FairPour posts on its Facebook Page shows up on the site automatically. It runs in one of two modes:

1. **Embed mode (default, no setup).** If no Facebook keys are set, the section shows Facebook's official Page embed for facebook.com/fairpour, with the live timeline, follower count and Follow button. Some ad blockers and strict privacy browsers hide Facebook embeds.
2. **Custom feed mode (on-brand cards).** With `FB_PAGE_ID` and `FB_PAGE_TOKEN` set, the server pulls the latest posts through the Graph API (v26.0) and shows the newest 3 as styled cards. Posts are cached for 20 minutes. If Facebook errors out, the site keeps showing the last good posts. If it has none, it falls back to the embed.

### Getting the Page token (needs admin or full-control access to the FairPour Page)

1. At developers.facebook.com, create an app (type **Business**). Development mode is fine.
2. Open **Graph API Explorer**, pick the app, and add the permissions `pages_show_list` and `pages_read_engagement`. Click **Generate Access Token** and approve the FairPour Page.
3. Paste that token into the **Access Token Debugger** and click **Extend Access Token** to get a long-lived user token.
4. In the Explorer, run `GET /me/accounts` with the long-lived token. Copy FairPour's `id` into `FB_PAGE_ID` and its `access_token` into `FB_PAGE_TOKEN`. A Page token made from a long-lived user token doesn't expire unless the password changes or access is removed.
5. Add both values in Render under Environment and redeploy.

## Folder layout

```
server.js        thin entry point
db/              SQLite setup (inquiries table)
lib/             auth (password + signed cookie), mailer, Facebook Graph API client
routes/          inquiry API, Facebook feed API, admin routes
views/           admin login + dashboard pages
public/          the website (html, css, js, images)
```

## Updating content

- **Hours / phones / addresses:** edit `public/index.html` (locations section, hours strip, footer) **and** the JSON-LD block in `<head>`.
- **Photos:** drop new files in `public/images/` and update the `src` in `index.html`.
