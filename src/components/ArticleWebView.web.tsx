import React, { useEffect } from 'react';
import { C } from '../theme';

interface Props {
  html: string;
  articleTitle: string;
  onLinkPress: (title: string) => void;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%;
    background: ${C.bg};
    color: ${C.text};
    font-family: Inter, -apple-system, system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.65;
    overflow-x: hidden;
  }
  body { padding: 0 18px 60px; }
  h1 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; }
  h2 { font-size: 17px; font-weight: 600; margin: 20px 0 8px; padding-bottom: 8px; border-bottom: 1px solid ${C.border}; }
  h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
  p { margin: 8px 0; }
  a[href^="wiki://"] {
    color: ${C.accent};
    text-decoration: none;
    border-bottom: 1px solid rgba(109,255,109,0.25);
    cursor: pointer;
  }
  a[href^="wiki://"]:hover { background: ${C.accentGlow}; border-radius: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
  td, th { padding: 6px 10px; border: 1px solid ${C.border}; text-align: left; }
  th { color: ${C.accent}; font-weight: 600; }
  img, figure, .thumb, .mw-references-wrap, .reflist { display: none !important; }
  ul, ol { padding-left: 20px; }
  li { margin: 4px 0; }
  blockquote { border-left: 3px solid ${C.borderBright}; margin: 10px 0; padding: 8px 14px; color: ${C.muted}; }
`;

const SCRIPT = `
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a[href^="wiki://"]');
    if (el) {
      e.preventDefault();
      var title = el.getAttribute('data-wiki') || decodeURIComponent(el.href.replace('wiki://', ''));
      window.parent.postMessage({ type: 'wiki-link', title: title }, '*');
    }
  });
`;

function buildHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>${CSS}</style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
  <script>${SCRIPT}</script>
</body>
</html>`;
}

export function ArticleWebView({ html, articleTitle, onLinkPress }: Props) {
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'wiki-link' && e.data.title) {
        onLinkPress(e.data.title);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onLinkPress]);

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <iframe
        srcDoc={buildHtml(html, articleTitle)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: C.bg,
        }}
        sandbox="allow-scripts"
        title={articleTitle}
      />
    </div>
  );
}
