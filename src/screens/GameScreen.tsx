import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WikiArticle } from '../types';
import { useGameStore } from '../store/gameStore';
import { fetchArticleHtml } from '../services/wikipedia';
import { ArticleWebView } from '../components/ArticleWebView';
import { GameHeader } from '../components/GameHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type HintContent = { type: string; text: string } | null;

export function GameScreen({ navigation, route: navRoute }: Props) {
  const { route } = navRoute.params;
  const { startRace, navigateTo, completeRace, forfeitRace, race } = useGameStore();

  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<HintContent>(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    startRace(route);
    loadArticle(route.startTitle);
  }, []);

  async function loadArticle(title: string) {
    setLoading(true);
    setError(null);
    setHint(null);
    try {
      const data = await fetchArticleHtml(title);
      setArticle(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }

  const handleLinkPress = useCallback(
    async (title: string) => {
      if (!race || race.status !== 'active') return;

      // Check win condition
      const normalizedTarget = route.endTitle.toLowerCase().trim();
      const normalizedClicked = title.toLowerCase().trim();

      navigateTo(title);

      if (normalizedClicked === normalizedTarget) {
        // Win!
        const result = completeRace();
        if (result) {
          navigation.replace('Result', { result });
        }
        return;
      }

      await loadArticle(title);
    },
    [race, route.endTitle, navigateTo, completeRace, navigation]
  );

  function handleHint(hintType: string) {
    let text = '';
    if (hintType === 'category') {
      text = `The target article "${route.endTitle}" is in the category: Notable ${route.difficulty === 'easy' ? 'animals' : route.difficulty === 'medium' ? 'historical topics' : 'scientific concepts'}.`;
    } else if (hintType === 'waypoint') {
      text = `Try navigating through a related topic to reach "${route.endTitle}".`;
    } else {
      text = `Navigate directly to "${route.endTitle}" from any article that links to it.`;
    }
    setHint({ type: hintType, text });
  }

  function handleGiveUp() {
    const result = forfeitRace();
    if (result) {
      navigation.replace('Result', { result });
    }
  }

  return (
    <View style={styles.container}>
      <GameHeader onGiveUp={handleGiveUp} onHint={handleHint} />

      {hint && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintTitle}>
            Hint ({hint.type.charAt(0).toUpperCase() + hint.type.slice(1)})
          </Text>
          <Text style={styles.hintText}>{hint.text}</Text>
          <TouchableOpacity onPress={() => setHint(null)} style={styles.hintClose}>
            <Text style={styles.hintCloseText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadArticle(race?.clickHistory.at(-1) ?? route.startTitle)}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {article && !loading && !error && (
        <ArticleWebView
          html={article.html}
          articleTitle={article.title}
          onLinkPress={handleLinkPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#cc3300',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  hintBanner: {
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    padding: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 14,
    color: '#78350f',
  },
  hintClose: {
    alignSelf: 'flex-end',
  },
  hintCloseText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
});
