import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { C } from '../theme';

interface Props {
  html: string;
  articleTitle: string;
  onLinkPress: (title: string) => void;
}

// Namespaces that should not be navigable in-game
const SKIP_PREFIXES = [
  'Wikipedia:', 'File:', 'Special:', 'Help:', 'Talk:', 'User:',
  'Category:', 'Template:', 'Portal:', 'WP:', 'Image:', 'Media:',
  'MediaWiki:', 'Module:', 'Draft:',
];

function buildInjectedJs(bg: string, text: string, accent: string, border: string, muted: string, borderBright: string, accentGlow: string): string {
  const skipPrefixes = JSON.stringify(SKIP_PREFIXES);
  return `
(function() {
  var style = document.createElement('style');
  style.textContent = [
    'html,body{background:${bg}!important;margin:0;padding:0}',
    'body{font-family:-apple-system,system-ui,sans-serif;font-size:15px;line-height:1.65;color:${text}!important;padding:0 18px 60px}',
    '*{background-color:transparent!important;color:${text}!important}',
    'h1{font-size:22px;font-weight:700;margin:20px 0 10px}',
    'h2{font-size:17px;font-weight:600;margin:20px 0 8px;padding-bottom:8px;border-bottom:1px solid ${border}!important}',
    'h3{font-size:15px;font-weight:600;margin:14px 0 6px}',
    'p{margin:8px 0}',
    'a[href^="wiki://"],a[href^="/wiki/"]{color:${accent}!important;text-decoration:none!important;border-bottom:1px solid rgba(109,255,109,0.25)!important}',
    'a[href^="wiki://"]:active,a[href^="/wiki/"]:active{background:${accentGlow}!important;border-radius:2px}',
    'table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}',
    'td,th{padding:6px 10px;border:1px solid ${border}!important;text-align:left}',
    'th{color:${accent}!important;font-weight:600}',
    'img,figure,.thumb,.mw-references-wrap,.reflist{display:none!important}',
    'ul,ol{padding-left:20px}',
    'li{margin:4px 0}',
    'blockquote{border-left:3px solid ${borderBright}!important;margin:10px 0;padding:8px 14px;color:${muted}!important}',
  ].join('');
  document.head.appendChild(style);

  var skipPrefixes = ${skipPrefixes};

  function extractWikiTitle(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return null;
    var raw = null;
    if (href.startsWith('wiki://')) {
      raw = decodeURIComponent(href.slice(7));
    } else if (href.startsWith('/wiki/')) {
      raw = decodeURIComponent(href.slice(6)).split('#')[0].split('?')[0];
    } else {
      var m = href.match(/wikipedia\\.org\\/wiki\\/([^#?]+)/);
      if (m) raw = decodeURIComponent(m[1]);
    }
    if (!raw) return null;
    raw = raw.replace(/_/g, ' ').trim();
    for (var i = 0; i < skipPrefixes.length; i++) {
      if (raw.indexOf(skipPrefixes[i]) === 0) return null;
    }
    return raw || null;
  }

  document.addEventListener('click', function(e) {
    var el = e.target.closest('a');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var title = el.getAttribute('data-wiki') || extractWikiTitle(href);
    if (title) {
      e.preventDefault();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wiki-link', title: title }));
    }
  });
})();
true;
`.trim();
}

const FULL_HTML = (body: string, title: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;

export function ArticleWebView({ html, articleTitle, onLinkPress }: Props) {
  const injectedJS = buildInjectedJs(
    C.bg, C.text, C.accent, C.border, C.muted, C.borderBright, C.accentGlow
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'wiki-link' && msg.title) {
          onLinkPress(msg.title);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onLinkPress]
  );

  const handleNavigation = useCallback((request: WebViewNavigation) => {
    if (
      request.url === 'about:blank' ||
      request.url.startsWith('data:') ||
      request.url.startsWith('blob:')
    ) return true;
    // All wiki navigation is handled by the JS click interceptor above
    return false;
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: FULL_HTML(html, articleTitle) }}
        injectedJavaScript={injectedJS}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleNavigation}
        startInLoadingState={false}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        backgroundColor={C.bg}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  webview: { flex: 1, backgroundColor: C.bg },
});
