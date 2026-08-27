import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, DailyChallenge, DailyRoute } from '../types';
import { fetchDailyChallenge } from '../services/dailyChallenge';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function HomeScreen({ navigation }: Props) {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyChallenge()
      .then(setChallenge)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function startGame(route: DailyRoute) {
    navigation.navigate('Game', { route });
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>WikiRacer</Text>
        <Text style={styles.tagline}>Navigate Wikipedia. Race the clock.</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Failed to load challenge: {error}</Text>
        </View>
      )}

      {challenge && (
        <View style={styles.challenges}>
          <Text style={styles.sectionTitle}>Today's Challenges</Text>
          {challenge.routes.map((route) => (
            <RouteCard
              key={route.difficulty}
              route={route}
              onPress={() => startGame(route)}
            />
          ))}
        </View>
      )}

      <View style={styles.howToPlay}>
        <Text style={styles.sectionTitle}>How to Play</Text>
        <Text style={styles.rule}>1. Start at one Wikipedia article</Text>
        <Text style={styles.rule}>2. Click internal links to navigate</Text>
        <Text style={styles.rule}>3. Reach the target article</Text>
        <Text style={styles.rule}>4. Fewest clicks (closest to par) wins!</Text>
      </View>
    </ScrollView>
  );
}

function RouteCard({ route, onPress }: { route: DailyRoute; onPress: () => void }) {
  const color = DIFFICULTY_COLORS[route.difficulty];
  return (
    <TouchableOpacity style={styles.routeCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.difficultyBadge, { backgroundColor: color }]}>
        <Text style={styles.difficultyText}>{DIFFICULTY_LABELS[route.difficulty]}</Text>
      </View>
      <View style={styles.routeInfo}>
        <Text style={styles.routePath} numberOfLines={1}>
          {route.startTitle} → {route.endTitle}
        </Text>
        <Text style={styles.routePar}>Par: {route.parClicks} clicks</Text>
      </View>
      <Text style={styles.playArrow}>▶</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#cce0ff',
    marginTop: 4,
  },
  date: {
    fontSize: 13,
    color: '#99c2ff',
    marginTop: 8,
  },
  loader: {
    marginTop: 60,
  },
  errorBox: {
    margin: 24,
    padding: 16,
    backgroundColor: '#fff0f0',
    borderRadius: 12,
  },
  errorText: {
    color: '#cc3300',
    fontSize: 14,
  },
  challenges: {
    padding: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  routeInfo: {
    flex: 1,
    gap: 2,
  },
  routePath: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  routePar: {
    fontSize: 12,
    color: '#888',
  },
  playArrow: {
    fontSize: 16,
    color: '#0066cc',
  },
  howToPlay: {
    marginHorizontal: 24,
    marginTop: 8,
    gap: 6,
  },
  rule: {
    fontSize: 14,
    color: '#555',
    paddingLeft: 4,
  },
});
