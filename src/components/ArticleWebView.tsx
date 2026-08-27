import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { C, F } from '../theme';

interface Props {
  html: string;
  articleTitle: string;
  onLinkPress: (title: string) => void;
}

const INJECTED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');
  html, body {
    background-color: ${C.bg} !important;
    margin: 0; padding: 0;
  }
  body {
    font-family: 'Inter', -apple-system, system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.65;
    color: ${C.text} !important;
    padding: 0 18px 60px;
    max-width: 100%;
  }
  * { background-color: transparent !important; color: ${C.text} !important; }
  h1 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; color: ${C.text} !important; }
  h2 {
    font-size: 17px; font-weight: 600; margin: 20px 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid ${C.border} !important;
    color: ${C.text} !important;
  }
  h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; color: ${C.text} !important; }
  p { margin: 8px 0; }
  a[href^="wiki://"] {
    color: ${C.accent} !important;
    text-decoration: none !important;
    border-bottom: 1px solid rgba(109,255,109,0.25) !important;
  }
  a[href^="wiki://"]:active { background-color: ${C.accentGlow} !important; border-radius: 2px; }
  table {
    width: 100%; border-collapse: collapse; font-size: 13px;
    margin: 10px 0; border: 1px solid ${C.border} !important;
  }
  td, th {
    padding: 6px 10px;
    border: 1px solid ${C.border} !important;
    color: ${C.text} !important;
    text-align: left;
  }
  th { color: ${C.accent} !important; font-weight: 600; }
  img { display: none !important; }
  figure, .thumb { display: none !important; }
  .mw-references-wrap, .reflist { display: none !important; }
  ul, ol { padding-left: 20px; }
  li { margin: 4px 0; color: ${C.text} !important; }
  blockquote {
    border-left: 3px solid ${C.borderBright} !important;
    margin: 10px 0; padding: 8px 14px;
    color: ${C.muted} !important;
  }
`.replace(/\n/g, ' ');

const INJECTED_JS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = ${JSON.stringify(INJECTED_CSS)};
    document.head.appendChild(style);

    document.addEventListener('click', function(e) {
      var el = e.target.closest('a[href^="wiki://"]');
      if (el) {
        e.preventDefault();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'wiki-link',
          title: el.getAttribute('data-wiki') || decodeURIComponent(el.href.replace('wiki://', ''))
        }));
      }
    });
  })();
  true;
`;

const FULL_HTML = (body: string, title: string) => `
<!DOCTYPE html>
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
</html>
`;

export function ArticleWebView({ html, articleTitle, onLinkPress }: Props) {
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'wiki-link' && msg.title) {
          onLinkPress(msg.title);
        }
      } catch {
        // ignore
      }
    },
    [onLinkPress]
  );

  const handleNavigation = useCallback((request: WebViewNavigation) => {
    if (request.url === 'about:blank') return true;
    if (request.url.startsWith('wiki://')) return false;
    // Allow initial data load
    return request.url.startsWith('data:') || request.url === 'about:blank';
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: FULL_HTML(html, articleTitle) }}
        injectedJavaScript={INJECTED_JS}
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
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  webview: {
    flex: 1,
    backgroundColor: C.bg,
  },
});
