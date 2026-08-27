import React, { useCallback } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

interface Props {
  html: string;
  articleTitle: string;
  onLinkPress: (title: string) => void;
}

const INJECTED_CSS = `
  body {
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #1a1a1a;
    padding: 0 16px 40px;
    margin: 0;
    max-width: 100%;
  }
  a[href^="wiki://"] {
    color: #0066cc;
    text-decoration: none;
    border-bottom: 1px solid #cce0ff;
  }
  a[href^="wiki://"]:active {
    background: #e8f0fe;
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 8px 0; }
  td, th { padding: 4px 8px; border: 1px solid #ddd; }
  p { margin: 8px 0; }
  h1, h2, h3 { font-weight: 600; margin: 16px 0 8px; }
  h1 { font-size: 22px; }
  h2 { font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  h3 { font-size: 16px; }
  img { display: none; }
`.replace(/\n/g, ' ');

const INJECTED_JS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = '${INJECTED_CSS}';
    document.head.appendChild(style);

    document.addEventListener('click', function(e) {
      var el = e.target.closest('a[href^="wiki://"]');
      if (el) {
        e.preventDefault();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'wiki-link',
          title: el.getAttribute('data-wiki') || el.href.replace('wiki://', '')
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
    // Block all navigations except our initial about:blank or data load
    if (request.url.startsWith('wiki://')) return false;
    if (request.url === 'about:blank') return true;
    return false;
  }, []);

  return (
    <WebView
      style={styles.webview}
      originWhitelist={['*']}
      source={{ html: FULL_HTML(html, articleTitle) }}
      injectedJavaScript={INJECTED_JS}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleNavigation}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      )}
      scrollEnabled
      showsVerticalScrollIndicator
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
