import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WikiArticle } from '../types';
import { useGameStore } from '../store/gameStore';
import { fetchArticleHtml } from '../services/wikipedia';
import { ArticleWebView } from '../components/ArticleWebView';
import { GameHeader } from '../components/GameHeader';
import { C, F } from '../theme';
import { saveResult } from '../services/storage';

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

      const normalizedTarget = route.endTitle.toLowerCase().trim();
      const normalizedClicked = title.toLowerCase().trim();

      navigateTo(title);

      if (normalizedClicked === normalizedTarget) {
        const result = completeRace();
        if (result) {
          await saveResult(route.challengeId, route.difficulty, result);
          navigation.replace('Result', { result });
        }
        return;
      }

      await loadArticle(title);
    },
    [race, route.endTitle, navigateTo, completeRace, navigation]
  );

  function handleHint(hintType: string) {
    const hintMessages: Record<string, string> = {
      category:
        `"${route.endTitle}" falls in a broad ` +
        (route.difficulty === 'easy'
          ? 'animals & nature'
          : route.difficulty === 'medium'
          ? 'history & culture'
          : 'science & technology') +
        ' category.',
      waypoint: `Try navigating through a major hub article on your way to "${route.endTitle}".`,
      direct: `Look for an article that directly links to "${route.endTitle}".`,
    };
    setHint({ type: hintType, text: hintMessages[hintType] ?? '' });
  }

  async function handleGiveUp() {
    const result = forfeitRace();
    if (result) {
      await saveResult(route.challengeId, route.difficulty, result);
      navigation.replace('Result', { result });
    }
  }

  return (
    <View style={styles.container}>
      <GameHeader onGiveUp={handleGiveUp} onHint={handleHint} />

      {hint && (
        <View style={styles.hintBanner}>
          <View style={styles.hintBannerHeader}>
            <Text style={styles.hintType}>
              HINT · {hint.type.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => setHint(null)}>
              <Text style={styles.hintDismiss}>DISMISS</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>{hint.text}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>FETCHING ARTICLE...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorState}>
          <Text style={styles.errorCode}>ERR_LOAD_FAILED</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() =>
              loadArticle(race?.clickHistory.at(-1) ?? route.startTitle)
            }
          >
            <Text style={styles.retryBtnText}>RETRY</Text>
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
    backgroundColor: C.bg,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.muted,
    letterSpacing: 2,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorCode: {
    fontFamily: F.monoBold,
    fontSize: 12,
    color: C.danger,
    letterSpacing: 2,
  },
  errorMsg: {
    fontFamily: F.mono,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.accent,
    backgroundColor: C.accentDim,
  },
  retryBtnText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 2,
  },
  hintBanner: {
    backgroundColor: C.elevated,
    borderBottomWidth: 1,
    borderBottomColor: C.warning,
    padding: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  hintBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintType: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.warning,
    letterSpacing: 2,
  },
  hintDismiss: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1,
  },
  hintText: {
    fontFamily: F.mono,
    fontSize: 12,
    color: C.muted,
    letterSpacing: 0.3,
  },
});
