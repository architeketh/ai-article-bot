// Node 18+/20+
// Syncs RSS into your Gist without touching saved/archived/deleted arrays.
// It merges new articles by id and preserves existing fields.

// ---- config ----
const GIST_ID  = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const GIST_FILE = process.env.GIST_FILE || 'ai-architecture-articles.json';

if (!GIST_ID || !GIST_TOKEN) {
  console.error('Missing GIST_ID or GIST_TOKEN env vars.');
  process.exit(1);
}

import Parser from 'rss-parser';
import fetch from 'node-fetch';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'rss-sync/1.0 (+github action)' },
});

const FEEDS = [
  { url: 'https://www.archdaily.com/feed', category: 'Architecture News', source: 'ArchDaily', logo: '🏛️', priority: 1, requireBoth: true },
  { url: 'https://www.dezeen.com/feed/', category: 'Design Innovation', source: 'Dezeen', logo: '📐', priority: 1, requireBoth: true },
  { url: 'https://www.architectmagazine.com/rss', category: 'Practice & Technology', source: 'Architect Magazine', logo: '📰', priority: 1, requireBoth: true },
  { url: 'https://architizer.com/blog/feed/', category: 'Architecture Blog', source: 'Architizer', logo: '🏗️', priority: 1, requireBoth: true },
  { url: 'https://www.constructiondive.com/feeds/news/', category: 'Construction Tech', source: 'Construction Dive', logo: '👷', priority: 2, requireBoth: true },
  { url: 'https://www.architecturaldigest.com/feed/rss', category: 'Design & Architecture', source: 'Architectural Digest', logo: '🏠', priority: 1, requireBoth: false }
];

// ---- helpers (mirror client logic) ----
function categorize(title, desc, fallback) {
  const t = (title + ' ' + desc).toLowerCase();
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

function extractKeywords(text) {
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
    if (keys.some(kw => new RegExp(kw,'i').test(t))) found.push(label);
  }
  return found.slice(0,4);
}

function cleanHtml(s='') { return s.replace(/<[^>]*>/g,''); }

function mergeById(primary=[], secondary=[]) {
  const m = new Map();
  [...secondary, ...primary].forEach(a => { if (a?.id) m.set(a.id, a); });
  return [...m.values()];
}

// ---- load existing gist ----
async function loadGist() {
  const metaRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `Bearer ${GIST_TOKEN}` }
  });
  if (!metaRes.ok) throw new Error(`Gist fetch failed: ${metaRes.status}`);
  const meta = await metaRes.json();
  const file = meta.files?.[GIST_FILE];
  if (!file?.content) return { articles: [], savedArticles: [], archivedArticles: [], deletedArticles: [] };
  const json = JSON.parse(file.content);
  return {
    articles: Array.isArray(json.articles) ? json.articles : [],
    savedArticles: Array.isArray(json.savedArticles) ? json.savedArticles : [],
    archivedArticles: Array.isArray(json.archivedArticles) ? json.archivedArticles : [],
    deletedArticles: Array.isArray(json.deletedArticles) ? json.deletedArticles : [],
  };
}

// ---- fetch all feeds ----
async function fetchAll() {
  const out = [];
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = parsed.items || [];
      const filtered = items
        .filter(item => {
          const title = item.title || '';
          const desc  = item.contentSnippet || item.content || item.summary || item.contentSnippet || '';
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
          const clean = cleanHtml(desc).slice(0,200);
          const stableId = item.link || item.guid || (feed.source + '-' + title.replace(/\W/g,'').slice(0,30));
          return {
            id: stableId,
            title,
            source: feed.source,
            sourceLogo: feed.logo,
            category: categorize(title, desc, feed.category),
            date: item.isoDate || item.pubDate || new Date().toISOString(),
            readTime: 5,
            summary: (clean + '...'),
            url: item.link || '#',
            trending: Math.random() > 0.75,
            keywords: extractKeywords(title + ' ' + desc),
            priority: feed.priority,
            archived: false,
            manual: false
          };
        });
      out.push(...filtered);
    } catch (e) {
      console.warn('Feed error:', feed.source, e.message || e);
    }
  }
  return out;
}

// ---- main ----
(async () => {
  try {
    const existing = await loadGist();
    const fetched = await fetchAll();

    // Honor deletions: never re-add deleted ids
    const deletedSet = new Set(existing.deletedArticles || []);
    const filteredFetched = fetched.filter(a => !deletedSet.has(a.id));

    // Merge (prefer fetched for fresh title/summary/date)
    const mergedArticles = mergeById(filteredFetched, existing.articles || []);

    const payload = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      articles: mergedArticles,
      savedArticles: existing.savedArticles || [],
      archivedArticles: existing.archivedArticles || [],
      deletedArticles: existing.deletedArticles || []
    };

    const body = {
      description: 'AI Architecture Articles Backup',
      public: true,
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
    console.log('✅ Gist updated with', mergedArticles.length, 'articles at', payload.exportDate);
  } catch (e) {
    console.error('❌ Sync failed:', e.message || e);
    process.exit(1);
  }
})();
