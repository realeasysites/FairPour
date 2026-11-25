(() => {
  'use strict';

  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // "Open now" pill: all cafés are open daily 8am–4pm, kitchen until 3pm (Eastern time).
  const pill = document.getElementById('open-pill');
  if (pill) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const h = Number(parts.find((p) => p.type === 'hour').value) % 24;
      const m = Number(parts.find((p) => p.type === 'minute').value);
      const mins = h * 60 + m;
      const text = pill.querySelector('.open-text');
      if (mins >= 480 && mins < 960) {
        pill.classList.add('is-open');
        text.textContent = mins < 900 ? 'Open now · Kitchen open until 3pm' : 'Open now until 4pm · Kitchen closed';
      } else {
        text.textContent = mins < 480 ? 'Opens today at 8am' : 'Closed now · Opens 8am daily';
      }
    } catch (_) { /* keep default text */ }
  }

  // Scroll reveal
  const targets = document.querySelectorAll('.section-head, .menu-card, .loc-card, .story-copy, .story-photos, .beans-copy, .beans-photo, .inquiry-form, .contact-copy, .ig-grid a');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  }

  // Links that pre-pick the inquiry topic (e.g. "Wholesale coffee")
  const form = document.getElementById('inquiry-form');
  document.querySelectorAll('[data-topic]').forEach((a) => {
    a.addEventListener('click', () => { if (form) form.topic.value = a.dataset.topic; });
  });

  // Inquiry form
  if (form) {
    const status = form.querySelector('.form-status');
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !data.message.trim()) {
        status.textContent = 'Please add your name, a valid email and a message.';
        status.classList.add('err');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      try {
        const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Something went wrong.');
        form.reset();
        status.textContent = 'Thanks! Your message is in. The FairPour team will get back to you soon.';
        status.classList.add('ok');
      } catch (err) {
        status.textContent = err.message + ' You can also call your café directly.';
        status.classList.add('err');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
    });
  }

  // Facebook feed: custom cards when the server has Graph API access, otherwise Facebook's Page embed.
  const feed = document.getElementById('fb-feed');
  if (feed) {
    const pageUrl = feed.dataset.page;
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const safeUrl = (u) => (/^https:\/\//i.test(u || '') ? u : pageUrl);
    const clip = (t, n) => (t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t);
    const when = (iso) => {
      const d = new Date(iso);
      if (isNaN(d)) return '';
      const days = Math.floor((Date.now() - d) / 86400000);
      if (days < 1) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
    };

    const renderEmbed = () => {
      const w = Math.min(500, Math.max(280, feed.clientWidth));
      const src = 'https://www.facebook.com/plugins/page.php?' + new URLSearchParams({
        href: pageUrl, tabs: 'timeline', width: String(w), height: '620', small_header: 'true',
        adapt_container_width: 'true', hide_cover: 'false', show_facepile: 'false',
      });
      feed.innerHTML = `<div class="fb-embed">
        <div class="fb-embed-side">
          <img src="/images/latte-art.jpg" alt="Latte art at FairPour" loading="lazy">
          <p>Scroll our latest Facebook posts right here, or tap through to follow FairPour for daily specials and new roasts.</p>
        </div>
        <div class="fb-embed-frame"><iframe src="${esc(src)}" title="FairPour Coffee Roasters on Facebook" loading="lazy" scrolling="no" allowfullscreen allow="clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div>
      </div>`;
    };

    const renderPosts = (posts) => {
      feed.innerHTML = `<div class="fb-posts">${posts.slice(0, 3).map((p) => `
        <a class="fb-post${p.image ? '' : ' text-only'}" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">
          ${p.image ? `<div class="fb-post-img"><img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>` : ''}
          <div class="fb-post-body">
            <div class="fb-post-meta"><img src="/images/logo-160.png" alt="">FairPour · ${esc(when(p.date))}</div>
            ${p.text ? `<p class="fb-post-text">${esc(clip(p.text, p.image ? 180 : 260))}</p>` : ''}
            <span class="fb-post-link">Read on Facebook →</span>
          </div>
        </a>`).join('')}</div>`;
    };

    fetch('/api/facebook-feed')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => (d.configured && d.posts && d.posts.length ? renderPosts(d.posts) : renderEmbed()))
      .catch(renderEmbed);
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
