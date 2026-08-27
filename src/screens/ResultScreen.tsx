import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useGameStore } from '../store/gameStore';
import { buildShareText } from '../services/wikipedia';
import { C, F } from '../theme';

const { width } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const resetRace = useGameStore((s) => s.resetRace);
  const race = useGameStore((s) => s.race);

  const isDNF = result.status === 'dnf';
  const diff = result.clicks - result.parClicks;

  const scoreLabel = isDNF
    ? 'DNF'
    : diff === 0
    ? 'PAR'
    : diff > 0
    ? `+${diff}`
    : `${diff}`;

  const scoreColor = isDNF
    ? C.danger
    : diff < 0
    ? C.easy
    : diff === 0
    ? C.accent
    : diff <= 2
    ? C.warning
    : C.danger;

  const outcomeLabel = isDNF
    ? 'DID NOT FINISH'
    : diff < 0
    ? 'UNDER PAR'
    : diff === 0
    ? 'EXACTLY PAR'
    : diff <= 2
    ? 'OVER PAR'
    : 'WAY OVER PAR';

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
    <View style={styles.root}>
      {/* Score hero */}
      <View style={styles.hero}>
        <View style={[styles.glowBehindScore, { backgroundColor: `${scoreColor}18` }]} />
        <Text style={[styles.scoreNum, { color: scoreColor, textShadowColor: scoreColor }]}>
          {scoreLabel}
        </Text>
        <Text style={styles.outcomeLabel}>{outcomeLabel}</Text>
        {!isDNF && (
          <Text style={styles.heroSub}>
            {result.clickHistory[0]} → {result.clickHistory[result.clickHistory.length - 1]}
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats grid */}
        <View style={styles.statsRow}>
          <StatBox label="CLICKS" value={isDNF ? '—' : String(result.clicks)} color={scoreColor} />
          <View style={styles.statSep} />
          <StatBox label="PAR" value={String(result.parClicks)} color={C.muted} />
          <View style={styles.statSep} />
          <StatBox label="TIME" value={timeStr} color={C.cyan} />
          <View style={styles.statSep} />
          <StatBox label="HINTS" value={String(result.hintsUsed)} color={C.warning} />
        </View>

        {/* Path visualization */}
        {!isDNF && result.clickHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>// YOUR PATH</Text>
            <View style={styles.pathContainer}>
              {result.clickHistory.map((title, i) => {
                const isStart = i === 0;
                const isEnd = i === result.clickHistory.length - 1;
                const nodeColor = isStart || isEnd ? C.accent : C.muted;
                return (
                  <View key={i} style={styles.pathStep}>
                    {i > 0 && (
                      <View style={styles.pathConnector}>
                        <View style={styles.pathLine} />
                        <Text style={styles.pathArrow}>↓</Text>
                        <View style={styles.pathLine} />
                      </View>
                    )}
                    <View style={styles.pathNodeRow}>
                      <View
                        style={[
                          styles.pathDot,
                          {
                            borderColor: nodeColor,
                            backgroundColor: isStart || isEnd ? C.accentDim : 'transparent',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.pathTitle,
                          { color: isStart || isEnd ? C.accent : C.text },
                          isEnd && {
                            textShadowColor: C.accent,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 6,
                          },
                        ]}
                      >
                        {title}
                      </Text>
                      {isStart && <Text style={styles.pathTag}>START</Text>}
                      {isEnd && <Text style={styles.pathTag}>END</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isDNF && (
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>SHARE RESULT</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Wikipedia content · CC BY-SA 4.0</Text>
      </ScrollView>
    </View>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    overflow: 'hidden',
  },
  glowBehindScore: {
    position: 'absolute',
    top: -40,
    left: width / 2 - 100,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  scoreNum: {
    fontFamily: F.display,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 32,
  },
  outcomeLabel: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.muted,
    letterSpacing: 3,
    marginTop: 4,
  },
  heroSub: {
    fontFamily: F.displayBold,
    fontSize: 14,
    color: C.dim,
    marginTop: 10,
    letterSpacing: 1,
  },

  scrollContent: {
    paddingBottom: 60,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: C.elevated,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: F.monoBold,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 8,
    color: C.dim,
    letterSpacing: 1.5,
  },
  statSep: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },

  // Section
  section: {
    margin: 20,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.muted,
    letterSpacing: 1.5,
  },

  // Path
  pathContainer: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 0,
  },
  pathStep: {
    gap: 0,
  },
  pathNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pathDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  pathTitle: {
    fontFamily: F.displayBold,
    fontSize: 16,
    flex: 1,
    letterSpacing: 0.3,
  },
  pathTag: {
    fontFamily: F.mono,
    fontSize: 8,
    color: C.accent,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: C.accentGlow,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pathConnector: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingLeft: 4,
    gap: 0,
  },
  pathLine: {
    width: 1,
    height: 6,
    backgroundColor: C.border,
  },
  pathArrow: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.dim,
    lineHeight: 12,
  },

  // Actions
  actions: {
    marginHorizontal: 20,
    marginTop: 8,
    gap: 10,
  },
  shareBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  shareBtnText: {
    fontFamily: F.monoBold,
    fontSize: 13,
    color: C.bg,
    letterSpacing: 2,
  },
  homeBtn: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  homeBtnText: {
    fontFamily: F.mono,
    fontSize: 13,
    color: C.muted,
    letterSpacing: 2,
  },

  footer: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.dim,
    textAlign: 'center',
    marginTop: 28,
    letterSpacing: 1,
  },
});
