import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, DailyChallenge, DailyRoute, RaceResult, Difficulty } from '../types';
import { fetchDailyChallenge } from '../services/dailyChallenge';
import { loadAllResults } from '../services/storage';
import { C, F, difficultyColor, textGlow, boxGlow } from '../theme';

const { width } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Partial<Record<Difficulty, RaceResult>>>({});

  useEffect(() => {
    fetchDailyChallenge()
      .then(setChallenge)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Reload results every time this screen comes into focus (e.g. after finishing a race)
  useFocusEffect(
    React.useCallback(() => {
      if (!challenge) return;
      const difficulties = challenge.routes.map((r) => r.difficulty);
      loadAllResults(challenge.id, difficulties).then(setResults);
    }, [challenge])
  );

  // Also load results once challenge is first available
  useEffect(() => {
    if (!challenge) return;
    const difficulties = challenge.routes.map((r) => r.difficulty);
    loadAllResults(challenge.id, difficulties).then(setResults);
  }, [challenge]);

  const today = new Date();
  const dateStr = today
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.glowCircle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>WIKI{'\n'}RACER</Text>
          <Text style={styles.tagline}>navigate · race · win</Text>
          <View style={styles.dateRow}>
            <View style={styles.datePulse} />
            <Text style={styles.dateText}>{dateStr} · DAILY CHALLENGE</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>// TODAY'S MISSIONS</Text>

          {loading && (
            <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>LOAD FAILED — {error}</Text>
            </View>
          )}

          {challenge?.routes.map((route) => (
            <MissionCard
              key={route.difficulty}
              route={route}
              result={results[route.difficulty] ?? null}
              onPress={() => navigation.navigate('Game', { route })}
            />
          ))}
        </View>

        <View style={styles.howto}>
          <Text style={styles.sectionLabel}>// HOW IT WORKS</Text>
          {[
            ['01', 'START at a Wikipedia article'],
            ['02', 'TAP only internal wiki links'],
            ['03', 'REACH the target article'],
            ['04', 'BEAT PAR — fewest clicks wins'],
          ].map(([num, rule]) => (
            <View key={num} style={styles.ruleRow}>
              <Text style={styles.ruleNum}>{num}</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Wikipedia content · CC BY-SA 4.0</Text>
      </ScrollView>
    </View>
  );
}

function MissionCard({
  route,
  result,
  onPress,
}: {
  route: DailyRoute;
  result: RaceResult | null;
  onPress: () => void;
}) {
  const color = difficultyColor(route.difficulty);
  const isDone = result !== null;

  const content = isDone ? (
    <ResultSummary result={result} color={color} />
  ) : (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.cardTouchable}>
      <View style={[styles.playBtn, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.playBtnText, { color }]}>▶</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <View style={[styles.cardRail, { backgroundColor: color }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardMeta}>
          <View style={[styles.diffBadge, { borderColor: color }]}>
            <Text style={[styles.diffBadgeText, { color }]}>
              {route.difficulty.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.parLabel}>PAR {route.parClicks}</Text>
        </View>
        <Text style={styles.routeTitle} numberOfLines={1}>
          {route.startTitle}
          <Text style={styles.routeArrow}> → </Text>
          {route.endTitle}
        </Text>
      </View>
      {content}
    </View>
  );
}

function ResultSummary({ result, color }: { result: RaceResult; color: string }) {
  const isDNF = result.status === 'dnf';
  const diff = result.clicks - result.parClicks;
  const diffLabel = isDNF ? 'DNF' : diff === 0 ? 'PAR' : diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = isDNF
    ? C.danger
    : diff < 0
    ? C.easy
    : diff === 0
    ? C.accent
    : diff <= 2
    ? C.warning
    : C.danger;

  const mins = Math.floor(result.timeSeconds / 60);
  const secs = result.timeSeconds % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;

  return (
    <View style={styles.resultSummary}>
      <Text style={[styles.resultDiff, { color: diffColor, ...textGlow(diffColor, 8) }]}>
        {diffLabel}
      </Text>
      {!isDNF && (
        <Text style={styles.resultDetail}>
          {result.clicks} clicks · {timeStr}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  glowCircle: {
    position: 'absolute',
    top: -120,
    left: width / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: C.accentGlow,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

  hero: {
    paddingTop: 72,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  logo: {
    fontFamily: F.display,
    fontSize: 72,
    lineHeight: 64,
    letterSpacing: 6,
    color: C.accent,
    ...textGlow(C.accent, 24),
  },
  tagline: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.muted,
    letterSpacing: 3,
    marginTop: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    width: '100%',
  },
  datePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.accent,
    ...boxGlow(C.accent, 6, 1),
  },
  dateText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.muted,
    letterSpacing: 1.5,
  },

  section: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.muted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 72,
  },
  cardDone: {
    borderColor: C.borderBright,
    backgroundColor: C.elevated,
  },
  cardRail: {
    width: 3,
    alignSelf: 'stretch',
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTouchable: {
    paddingRight: 14,
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  diffBadgeText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  parLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.muted,
    letterSpacing: 1,
  },
  routeTitle: {
    fontFamily: F.displayBold,
    fontSize: 19,
    color: C.text,
    letterSpacing: 0.5,
  },
  routeArrow: {
    color: C.muted,
    fontFamily: F.displayBold,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: {
    fontSize: 13,
  },

  // Result summary shown in place of play button
  resultSummary: {
    paddingRight: 16,
    alignItems: 'flex-end',
    gap: 3,
  },
  resultDiff: {
    fontFamily: F.display,
    fontSize: 28,
    letterSpacing: 1,
  },
  resultDetail: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.muted,
    letterSpacing: 0.5,
  },

  howto: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 14,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  ruleNum: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.accent,
    width: 22,
    marginTop: 1,
  },
  ruleText: {
    fontFamily: F.mono,
    fontSize: 12,
    color: C.muted,
    flex: 1,
    letterSpacing: 0.5,
  },

  footer: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.dim,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 1,
  },
  errorBox: {
    padding: 14,
    backgroundColor: C.dangerDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.danger,
  },
  errorText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.danger,
    letterSpacing: 1,
  },
});
