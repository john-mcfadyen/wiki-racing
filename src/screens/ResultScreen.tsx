import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useGameStore } from '../store/gameStore';
import { buildShareText } from '../services/wikipedia';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const resetRace = useGameStore((s) => s.resetRace);
  const race = useGameStore((s) => s.race);

  const isDNF = result.status === 'dnf';
  const diff = result.clicks - result.parClicks;
  const diffStr = isDNF ? 'DNF' : diff === 0 ? 'Par!' : diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = isDNF ? '#cc3300' : diff <= 0 ? '#22c55e' : diff <= 2 ? '#f59e0b' : '#cc3300';

  const mins = Math.floor(result.timeSeconds / 60);
  const secs = result.timeSeconds % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  function handleGoHome() {
    resetRace();
    navigation.navigate('Home');
  }

  const handleShare = useCallback(async () => {
    if (!race) return;
    const text = buildShareText(
      race.startArticle.title,
      race.endArticle.title,
      result.clicks,
      result.parClicks,
      result.timeSeconds,
      result.clickHistory
    );
    await Share.share({ message: text });
  }, [race, result]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scoreCard}>
        {isDNF ? (
          <>
            <Text style={styles.dnfEmoji}>💀</Text>
            <Text style={styles.dnfTitle}>Did Not Finish</Text>
            <Text style={styles.dnfSubtitle}>Better luck tomorrow!</Text>
          </>
        ) : (
          <>
            <Text style={[styles.diffBadge, { color: diffColor }]}>{diffStr}</Text>
            <Text style={styles.completedTitle}>Race Complete!</Text>
          </>
        )}
      </View>

      <View style={styles.statsGrid}>
        <StatBox label="Clicks" value={isDNF ? '—' : String(result.clicks)} />
        <StatBox label="Par" value={String(result.parClicks)} />
        <StatBox label="Time" value={timeStr} />
        <StatBox label="Hints" value={String(result.hintsUsed)} />
      </View>

      {!isDNF && (
        <View style={styles.pathSection}>
          <Text style={styles.pathTitle}>Your path</Text>
          <View style={styles.pathList}>
            {result.clickHistory.map((title, i) => (
              <View key={i} style={styles.pathItem}>
                {i > 0 && <Text style={styles.pathArrow}>↓</Text>}
                <View
                  style={[
                    styles.pathBubble,
                    i === 0 && styles.pathBubbleStart,
                    i === result.clickHistory.length - 1 && styles.pathBubbleEnd,
                  ]}
                >
                  <Text
                    style={[
                      styles.pathText,
                      i === 0 && styles.pathTextStart,
                      i === result.clickHistory.length - 1 && styles.pathTextEnd,
                    ]}
                  >
                    {title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!isDNF && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share result</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
          <Text style={styles.homeBtnText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  content: {
    paddingBottom: 60,
  },
  scoreCard: {
    backgroundColor: '#0066cc',
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  diffBadge: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#cce0ff',
  },
  dnfEmoji: {
    fontSize: 52,
  },
  dnfTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  dnfSubtitle: {
    fontSize: 14,
    color: '#99c2ff',
  },
  statsGrid: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  pathSection: {
    marginHorizontal: 20,
    gap: 12,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  pathList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 0,
  },
  pathItem: {
    alignItems: 'flex-start',
  },
  pathArrow: {
    fontSize: 14,
    color: '#0066cc',
    marginLeft: 16,
    marginVertical: 2,
  },
  pathBubble: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pathBubbleStart: {
    backgroundColor: '#e0edff',
  },
  pathBubbleEnd: {
    backgroundColor: '#dcfce7',
  },
  pathText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  pathTextStart: {
    color: '#0066cc',
  },
  pathTextEnd: {
    color: '#16a34a',
  },
  actions: {
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  shareBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  homeBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  homeBtnText: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 16,
  },
});
