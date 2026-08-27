import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useGameStore } from '../store/gameStore';

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

  function handleHint() {
    if (hintsLeft === 0) {
      Alert.alert('No hints left', 'You can now give up if you want.', [
        { text: 'Keep trying', style: 'cancel' },
        { text: 'Give Up', style: 'destructive', onPress: onGiveUp },
      ]);
      return;
    }
    Alert.alert(
      `Use hint? (${hintsLeft} left)`,
      `+3 click penalty. You have ${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} remaining.`,
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
    if (hintsLeft > 0) {
      Alert.alert('Give up?', 'Use all your hints first, or give up now for a DNF.', [
        { text: 'Keep trying', style: 'cancel' },
        { text: 'Give Up (DNF)', style: 'destructive', onPress: onGiveUp },
      ]);
    } else {
      Alert.alert('Give up?', 'This will count as a DNF.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Give Up', style: 'destructive', onPress: onGiveUp },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.target}>
        <Text style={styles.targetLabel}>Find</Text>
        <Text style={styles.targetTitle} numberOfLines={1}>
          {race.endArticle.title}
        </Text>
      </View>
      <View style={styles.stats}>
        <Stat label="Clicks" value={String(clicks)} />
        <Stat label="Par" value={String(race.parClicks)} />
        <Stat label="Time" value={timeStr} />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.hintBtn} onPress={handleHint}>
          <Text style={styles.hintBtnText}>Hint ({hintsLeft})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.giveUpBtn} onPress={handleGiveUp}>
          <Text style={styles.giveUpBtnText}>Give Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066cc',
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  hintBtn: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hintBtnText: {
    color: '#0066cc',
    fontWeight: '600',
    fontSize: 14,
  },
  giveUpBtn: {
    flex: 1,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  giveUpBtnText: {
    color: '#cc3300',
    fontWeight: '600',
    fontSize: 14,
  },
});
