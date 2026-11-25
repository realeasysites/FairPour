'use strict';
// Pulls the latest posts from FairPour's Facebook Page through the Graph API.
// Needs FB_PAGE_ID + FB_PAGE_TOKEN (a long-lived Page access token). When they
// aren't set, the site falls back to Facebook's official Page Plugin embed.

const CACHE_MS = 20 * 60 * 1000; // refresh at most every 20 minutes
let cache = { at: 0, posts: null };

function configured() {
  return Boolean(process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN);
}

function shape(p) {
  return {
    id: p.id,
    text: (p.message || '').trim(),
    image: p.full_picture || null,
    url: p.permalink_url || `https://www.facebook.com/${p.id}`,
    date: p.created_time,
  };
}

async function getPosts(limit = 6) {
  if (!configured()) return { configured: false, posts: [] };
  if (cache.posts && Date.now() - cache.at < CACHE_MS) return { configured: true, posts: cache.posts };

  const base = process.env.FB_GRAPH_BASE || 'https://graph.facebook.com';
  const version = process.env.FB_GRAPH_VERSION || 'v26.0';
  const url = new URL(`${base}/${version}/${encodeURIComponent(process.env.FB_PAGE_ID)}/posts`);
  url.searchParams.set('fields', 'message,created_time,permalink_url,full_picture');
  url.searchParams.set('limit', String(limit * 2)); // over-fetch; empty posts get filtered out
  url.searchParams.set('access_token', process.env.FB_PAGE_TOKEN);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error ? json.error.message : `HTTP ${res.status}`);
    const posts = (json.data || []).map(shape).filter((p) => p.text || p.image).slice(0, limit);
    cache = { at: Date.now(), posts };
    return { configured: true, posts };
  } catch (err) {
    console.error('[facebook] feed fetch failed:', err.message);
    // Serve the last good copy if we have one; otherwise the page shows the embed fallback.
    return { configured: true, posts: cache.posts || [], stale: true };
  }
}

module.exports = { getPosts, configured };
