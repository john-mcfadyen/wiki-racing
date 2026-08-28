import { WikiArticle } from '../types';

const ACTION_API = 'https://en.wikipedia.org/w/api.php';

export type PageInvalidReason = 'missing' | 'redirect' | 'disambiguation';

export interface PageValidation {
  title: string;         // canonical title as returned by API
  valid: boolean;
  reason?: PageInvalidReason;
}

/**
 * Batch-validates Wikipedia page titles in a single API call.
 * Returns a map keyed by the *input* title (case-insensitive match).
 * Detects: missing pages, redirects, disambiguation pages.
 */
export async function validateWikiPages(
  titles: string[]
): Promise<Map<string, PageValidation>> {
  const params = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop: 'info|pageprops',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${ACTION_API}?${params}`);
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  const data = await res.json();

  // Build a normalisation map: lowercase input title → canonical title
  // The API returns a `normalized` array when it changes capitalisation.
  const normMap = new Map<string, string>();
  for (const entry of (data.query?.normalized ?? []) as { from: string; to: string }[]) {
    normMap.set(entry.from.toLowerCase(), entry.to);
  }
  // Also map each input title to itself as a fallback
  for (const t of titles) {
    if (!normMap.has(t.toLowerCase())) normMap.set(t.toLowerCase(), t);
  }

  const results = new Map<string, PageValidation>();

  for (const page of Object.values(data.query?.pages ?? {}) as Record<string, unknown>[]) {
    const p = page as {
      title: string;
      missing?: unknown;
      redirect?: unknown;
      pageprops?: { disambiguation?: unknown };
    };

    let valid = true;
    let reason: PageInvalidReason | undefined;

    if ('missing' in p) {
      valid = false; reason = 'missing';
    } else if ('redirect' in p) {
      valid = false; reason = 'redirect';
    } else if (p.pageprops?.disambiguation !== undefined) {
      valid = false; reason = 'disambiguation';
    }

    // Map back to every input title that resolved to this canonical title
    for (const [lc, canonical] of normMap) {
      if (canonical === p.title) {
        // Find the original casing from the input array
        const original = titles.find((t) => t.toLowerCase() === lc) ?? p.title;
        results.set(original, { title: p.title, valid, reason });
      }
    }
  }

  return results;
}

export async function fetchArticleHtml(title: string): Promise<WikiArticle> {
  // Use the Action API parse endpoint — it sends origin=* which enables CORS
  // for browser/web environments. The REST API (rest_v1) mobile-sections endpoint
  // does not include CORS headers, causing "Failed to fetch" on web.
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    prop: 'text',
    format: 'json',
    origin: '*',
    disablelimitreport: '1',
    disableeditsection: '1',
  });

  const res = await fetch(`${ACTION_API}?${params}`);
  if (!res.ok) throw new Error(`Wikipedia fetch failed: ${res.status}`);
  const data = await res.json();

  if (data.error) throw new Error(data.error.info ?? 'Wikipedia API error');

  const pageid: number = data.parse?.pageid ?? 0;
  const pageTitle: string = data.parse?.title ?? title;
  const rawHtml: string = data.parse?.text?.['*'] ?? '';

  const strippedHtml = stripWikipediaHtml(rawHtml);
  return { pageid, title: pageTitle, html: strippedHtml };
}

export async function fetchArticleByPageid(pageid: number): Promise<WikiArticle> {
  const params = new URLSearchParams({
    action: 'query',
    pageids: String(pageid),
    prop: 'info',
    inprop: 'url',
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`${ACTION_API}?${params}`);
  const data = await res.json();
  const page = data.query.pages[pageid];
  return fetchArticleHtml(page.title);
}

// Headings that mark the end of navigable article content.
// Everything from the first match onwards is cut — these sections
// often contain the target article as a direct link, which would
// trivialise the game.
const END_SECTION_HEADINGS = [
  'See also', 'References', 'External links', 'Further reading',
  'Notes', 'Bibliography', 'Footnotes', 'Sources', 'Citations',
];

function truncateAtEndSections(html: string): string {
  // Matches <h2> or <h3> that contains any of the end-section labels,
  // accounting for nested spans the Action API wraps headings in.
  const labels = END_SECTION_HEADINGS.map((l) =>
    l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');
  const pattern = new RegExp(
    `<h[23][^>]*>(?:<[^>]+>\\s*)*(?:${labels})(?:\\s*<[^>]+>)*\\s*</h[23]>`,
    'i'
  );
  const match = pattern.exec(html);
  return match ? html.slice(0, match.index) : html;
}

function stripWikipediaHtml(html: string): string {
  // Cut end-matter sections first (See also, References, etc.)
  let result = truncateAtEndSections(html);

  // Remove elements we don't want
  result = result
    // Remove reference sections, edit sections, external link sections
    .replace(/<section[^>]*data-mw-section-id="0"[^>]*>/gi, '')
    // Remove citation/reference markers [1], [2], etc.
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
    // Remove external links (href starting with http but not /wiki/)
    .replace(/<a[^>]+href="https?:\/\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    // Remove images and figures
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<img[^>]*\/?>/gi, '')
    // Remove audio/video
    .replace(/<(audio|video)[\s\S]*?<\/\1>/gi, '')
    // Remove hatnotes and page-actions
    .replace(/<div[^>]*class="[^"]*hatnote[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Remove table of contents
    .replace(/<div[^>]*id="toc"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Remove edit buttons
    .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    // Remove coordinates
    .replace(/<span[^>]*id="coordinates"[^>]*>[\s\S]*?<\/span>/gi, '');

  // Rewrite internal wiki links to use our custom scheme
  result = result.replace(
    /<a[^>]+href="\/wiki\/([^"#]+)(?:#[^"]*)?"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, target, text) => {
      const decoded = decodeURIComponent(target).replace(/_/g, ' ');
      return `<a href="wiki://${decoded}" data-wiki="${decoded}">${text}</a>`;
    }
  );

  return result;
}

export function buildShareText(
  startTitle: string,
  endTitle: string,
  clicks: number,
  par: number,
  timeSeconds: number,
  clickHistory: string[]
): string {
  const diff = clicks - par;
  const diffStr = diff === 0 ? 'Par!' : diff > 0 ? `+${diff}` : `${diff}`;
  const mins = Math.floor(timeSeconds / 60);
  const secs = timeSeconds % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const path = clickHistory.join(' → ');
  return `WikiRacer 🌐\n${startTitle} → ${endTitle}\n${clicks} clicks (${diffStr}) · ${timeStr}\n\n${path}\n\nhttps://wikiracerapp.com`;
}
