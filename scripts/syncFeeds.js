// scripts/syncFeeds.js
// Node 18+/20+ (ESM)
//
// Env vars required (set via GitHub Actions secrets or your shell):
//   GIST_ID     = e.g. "e89e6b358e664cc9bbe2ed4bd0233638"
//   GIST_TOKEN  = classic PAT with "gist" scope
// Optional:
//   GIST_FILE   = filename inside the Gist (default: ai-architecture-articles.json)

import Parser from 'rss-parser';
import fetch from 'node-fetch';

// ---- env ----
const GIST_ID   = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const GIST_FILE  = process.env.GIST_FILE || 'ai-architecture-articles.json';

if (!GIST_ID || !GIST_TOKEN) {
  console.error('Missing GIST_ID or GIST_TOKEN env vars.');
  process.exit(1);
}

// ---- feed list (matches client defaults) ----
const FEEDS = [
  { url: 'https://www.archdaily.com/feed', category: 'Architecture News', source: 'ArchDaily', logo: '🏛️', priority: 1, requireBoth: true },
  { url: 'https://www.dezeen.com/feed/', category: 'Design Innovation', source: 'Dezeen', logo: '📐', priority: 1, requireBoth: true },
  { url: 'https://www.architectmagazine.com/rss', category: 'Practice & Technology', source: 'Architect Magazine', logo: '📰', priority: 1, requireBoth: true },
  { url: 'https://architizer.com/blog/feed/', category: 'Architecture Blog', source: 'Architizer', logo: '🏗️', priority: 1, requireBoth: true },
  { url: 'https://www.constructiondive.com/feeds/news/', category: 'Construction Tech', source: 'Construction Dive', logo: '👷', priority: 2, requireBoth: true },
  { url: 'https://www.architecturaldigest.com/feed/rss', category: 'Design & Architecture', source: 'Architectural Digest', logo: '🏠', priority: 1, requireBoth: false }
];

// ---- parser ----
const parser = new Parser({
  timeout: 15000, // ms; tighten if needed
  headers: { 'User-Agent': 'ai-arch-rss-sync/1.0 (+github action)' },
});

// ---- helpers mirroring client logic ----
function categorize(title, description, fallback) {
  const t = (title + ' ' + (description || '')).toLowerCase();
  if (/(chatgpt|gpt-4|gpt-3|claude|perplexity|gemini|bard|copilot|bing chat|llama)/i.test(t)) return 'Chat Engines';
  if (/(residential|house|home|apartment|villa|housing|single.family|multi.family)/i.test(t)) return 'Residential';
  if (/(commercial|office|retail|hotel|restaurant|hospitality|workplace|corporate)/i.test(t)) return 'Commercial';
  if (/(design process|workflow|collaboration|practice)/i.test(t)) return 'Design Process';
  if (/(tool|software|app|platform|midjourney|dall-e|plugin|extension)/i.test(t)) return 'AI Tools';
  if (/(machine learning|deep learning|neural network)/i.test(t)) return 'Machine Learning';
  if (/(generative|parametric|computational|algorithm)/i.test(t)) return 'Generative Design';
  if (/(bim|revit|archicad|building information)/i.test(t)) return 'BIM & Digital Tools';
  if (/(render|rendering|visualization|3d.*visual|photorealistic|vray|lumion|unreal|lookx|ai.*render)/i.test(t)) return 'Rendering & Visualization';
  if (/(virtual reality|augmented reality|vr|ar|xr)/i.test(t)) return 'VR/AR/XR';
  if (/(construction|fabrication|3d print|robotic)/i.test(t)) return 'Construction Tech';
  if (/(sustainable|sustainability|energy|climate)/i.test(t)) return 'Sustainability';
  if (/(education|teaching|learning|course)/i.test(t)) return 'Education';
  if (/(award|prize|winner|competition)/i.test(t)) return 'Awards & Recognition';
  if (/(trend|future|prediction|forecast)/i.test(t)) return 'Trends & Analysis';
  if (/(project|case study|firm)/i.test(t)) return 'Case Studies';
  return fallback;
}

function extractKeywords(text = '') {
  const groups = {
    'midjourney': ['midjourney'],
    'stable diffusion': ['stable diffusion'],
    'enscape': ['enscape'],
    'lumion': ['lumion'],
    'ai rendering': ['ai.*render','render.*ai','lookx','veras'],
    'chatgpt': ['chatgpt','gpt'],
    'generative design': ['generative','parametric'],
    'visualization': ['visualization','photorealistic'],
    'bim': ['bim','revit'],
    'machine learning': ['machine learning','ml','neural'],
    'computational': ['algorithm','computational'],
    'vr/ar': ['virtual reality','augmented reality','vr','ar'],
    'sustainability': ['sustainable','energy','climate']
  };
  const t = text.toLowerCase();
  const found = [];
  for (const [label, keys] of Object.entries(groups)) {
    if (keys.some(kw => new RegExp(kw, 'i').test(t))) found.push(label);
  }
  return found.slice(0, 4);
}

function cleanHtml(s = '') {
  return s.replace(/<[^>]*>/g, '');
}

function mergeById(primary = [], secondary = []) {
  // Later wins; we pass fetched as primary to prefer fresh titles/summaries/dates.
  const m = new Map();
  [...secondary, ...primary].forEach(a => { if (a?.id) m.set(a.id, a); });
  return [...m.values()];
}

// ---- robust RSS fetching (with fallbacks) ----
async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = new Error(`Status code ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return await res.text();
}

async function tryFeed2Json(url) {
  const proxy = `https://feed2json.org/convert?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  if (!res.ok) throw new Error(`feed2json status ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  // Normalize to a minimal shape rss-parser understands
  return items.map(it => ({
    title: it.title,
    link: it.url,
    guid: it.id,
    content: it.content_html || it.summary || '',
    isoDate: it.date_published || it.date_modified
  }));
}

function mapItems(items, feed) {
  return (items || [])
    .filter(item => {
      const title = item.title || '';
      const desc  = item.contentSnippet || item.content || item.summary || '';
      const text  = (title + ' ' + desc).toLowerCase();
      const hasAI = /\b(ai|artificial intelligence|machine learning|generative|parametric|computational|midjourney|chatgpt|render.*ai|ai.*render|algorithm|neural)\b/i.test(text);
      const hasArch = /\b(architect|design|building|construction|render|rendering|visualization|bim|3d.*model|structure|spatial)\b/i.test(text);
      const hasRendering = /\b(midjourney|dall-e|lookx|veras|enscape|lumion|twinmotion|render|rendering|visualization|photorealistic)\b/i.test(text);
      if (hasRendering) return true;
      return feed.requireBoth ? (hasAI && hasArch) : (hasAI || hasArch);
    })
    .map(item => {
      const title = item.title || 'Untitled';
      const desc  = item.contentSnippet || item.content || item.summary || '';
      const clean = cleanHtml(desc).slice(0, 200);
      const stableId = item.link || item.guid || (feed.source + '-' + title.replace(/\W/g, '').slice(0, 30));
      return {
        id: stableId,
        title,
        source: feed.source,
        sourceLogo: feed.logo,
        category: categorize(title, desc, feed.category),
        date: item.isoDate || item.pubDate || new Date().toISOString(),
        readTime: 5,
        summary: clean ? (clean + '...') : '...',
        url: item.link || '#',
        trending: Math.random() > 0.75,
        keywords: extractKeywords(title + ' ' + desc),
        priority: feed.priority,
        archived: false,
        manual: false
      };
    });
}

async function fetchAll() {
  const tasks = FEEDS.map(async (feed) => {
    // 1) Normal path: parser.parseURL
    try {
      const parsed = await parser.parseURL(feed.url);
      const out = mapItems(parsed.items || [], feed);
      console.log(`✓ ${feed.source}: ${out.length}`);
      return out;
    } catch (e1) {
      // 2) Fallback: feed2json
      try {
        if (e1?.status === 403 || /403/.test(String(e1))) {
          const items = await tryFeed2Json(feed.url);
          const out = mapItems(items, feed);
          console.log(`✓ (feed2json) ${feed.source}: ${out.length}`);
          return out;
        }
      } catch (e2) {
        // 3) Final fallback: raw XML + parseString
        try {
          const xml = await fetchText(feed.url, { 'User-Agent': 'ai-arch-rss-sync/1.0 (+github action)' });
          const parsed2 = await parser.parseString(xml);
          const out = mapItems(parsed2.items || [], feed);
          console.log(`✓ (xml) ${feed.source}: ${out.length}`);
          return out;
        } catch (e3) {
          console.warn('Feed error:', feed.source, e3.message || e3);
          return [];
        }
      }
      console.warn('Feed error:', feed.source, e1.message || e1);
      return [];
    }
  });

  const results = await Promise.all(tasks);
  return results.flat();
}

// ---- gist I/O ----
async function loadGist() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
  const meta = await res.json();
  const file = meta.files?.[GIST_FILE];
  if (!file?.content) {
    return { articles: [], savedArticles: [], archivedArticles: [], deletedArticles: [] };
  }
  const json = JSON.parse(file.content);
  return {
    articles: Array.isArray(json.articles) ? json.articles : [],
    savedArticles: Array.isArray(json.savedArticles) ? json.savedArticles : [],
    archivedArticles: Array.isArray(json.archivedArticles) ? json.archivedArticles : [],
    deletedArticles: Array.isArray(json.deletedArticles) ? json.deletedArticles : [],
  };
}

async function saveGist(payload) {
  const body = {
    description: 'AI Architecture Articles Backup',
    public: true, // your gist is public; adjust if you switch to private
    files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } }
  };

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GIST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Gist update failed: ${res.status}`);
}

// ---- main ----
(async () => {
  try {
    const existing = await loadGist();
    const fetched  = await fetchAll();

    // Honor deletions: never re-add deleted ids
    const deletedSet = new Set(existing.deletedArticles || []);
    const filteredFetched = fetched.filter(a => !deletedSet.has(a.id));

    // Merge by id (prefer fetched for freshness)
    const mergedArticles = mergeById(filteredFetched, existing.articles || []);

    const payload = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      articles: mergedArticles,
      savedArticles: existing.savedArticles || [],
      archivedArticles: existing.archivedArticles || [],
      deletedArticles: existing.deletedArticles || []
    };

    await saveGist(payload);

    console.log(`✅ Gist updated with ${mergedArticles.length} articles at ${payload.exportDate}`);
  } catch (e) {
    console.error('❌ Sync failed:', e.message || e);
    process.exit(1);
  }
})();
