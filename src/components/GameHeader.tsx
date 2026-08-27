import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { C, F } from '../theme';

interface Props {
  onGiveUp: () => void;
  onHint: (hintType: string) => void;
}

export function GameHeader({ onGiveUp, onHint }: Props) {
  const race = useGameStore((s) => s.race);
  const useHint = useGameStore((s) => s.useHint);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!race || race.status !== 'active') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - race.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [race]);

  if (!race) return null;

  const clicks = race.clickHistory.length - 1;
  const hintsLeft = 3 - race.hintsUsed;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;

  const clicksOverPar = clicks - race.parClicks;
  const clickColor =
    clicks === 0
      ? C.muted
      : clicksOverPar < 0
      ? C.easy
      : clicksOverPar === 0
      ? C.accent
      : clicksOverPar <= 2
      ? C.warning
      : C.danger;

  function handleHint() {
    if (hintsLeft === 0) {
      Alert.alert('Out of hints', 'All hints used. Give up?', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Give Up (DNF)', style: 'destructive', onPress: onGiveUp },
      ]);
      return;
    }
    Alert.alert(
      `Use hint? +3 click penalty`,
      `${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} remaining after this.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use hint',
          onPress: () => {
            const type = useHint();
            if (type) onHint(type);
          },
        },
      ]
    );
  }

  function handleGiveUp() {
    Alert.alert(
      'Give up?',
      hintsLeft > 0
        ? 'This counts as DNF. You still have hints left!'
        : 'This counts as a DNF.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Give Up', style: 'destructive', onPress: onGiveUp },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Target row */}
      <View style={styles.targetRow}>
        <View style={styles.targetPulse} />
        <Text style={styles.targetLabel}>FIND</Text>
        <Text style={styles.targetTitle} numberOfLines={1}>
          {race.endArticle.title}
        </Text>
      </View>

      {/* Stats + actions */}
      <View style={styles.bottomRow}>
        <View style={styles.statsRow}>
          <Stat label="CLICKS" value={String(clicks)} valueColor={clickColor} />
          <View style={styles.statDivider} />
          <Stat label="PAR" value={String(race.parClicks)} valueColor={C.muted} />
          <View style={styles.statDivider} />
          <Stat label="TIME" value={timeStr} valueColor={C.cyan} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.hintBtn,
              hintsLeft === 0 && styles.hintBtnDisabled,
            ]}
            onPress={handleHint}
          >
            <Text style={[styles.hintBtnText, hintsLeft === 0 && styles.hintBtnTextDisabled]}>
              HINT {hintsLeft > 0 ? `×${hintsLeft}` : '—'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.giveUpBtn} onPress={handleGiveUp}>
            <Text style={styles.giveUpText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 1,
  },
  targetLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.muted,
    letterSpacing: 2,
  },
  targetTitle: {
    fontFamily: F.displayBold,
    fontSize: 18,
    color: C.accent,
    flex: 1,
    letterSpacing: 0.5,
    textShadowColor: C.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stat: {
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    fontFamily: F.monoBold,
    fontSize: 18,
    color: C.text,
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 8,
    color: C.dim,
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: C.border,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: C.accent,
  },
  hintBtnDisabled: {
    backgroundColor: 'transparent',
    borderColor: C.dim,
  },
  hintBtnText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.accent,
    letterSpacing: 1,
  },
  hintBtnTextDisabled: {
    color: C.dim,
  },
  giveUpBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: C.dangerDim,
    borderWidth: 1,
    borderColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giveUpText: {
    fontFamily: F.monoBold,
    fontSize: 12,
    color: C.danger,
  },
});
