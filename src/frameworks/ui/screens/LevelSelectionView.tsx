import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LevelSelection } from '@application/use-cases/load-levels';

interface LevelSelectionViewProps {
  readonly title: string;
  readonly showStars: boolean;
  readonly maxStars?: number;
  readonly selection: LevelSelection;
  readonly onSelectLevel: (id: string) => void;
}

/** Humble View: displays CU-08 data and reports the selected unlocked level. */
export function LevelSelectionView({
  title,
  showStars,
  maxStars = 3,
  selection,
  onSelectLevel,
}: LevelSelectionViewProps) {
  const summary = showStars
    ? `${selection.totalStars} stars earned`
    : `${selection.completedLevels} of ${selection.levels.length} levels completed`;

  return (
    <FlatList
      data={selection.levels}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.detail}>{summary}</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.detail}>No levels available</Text>
      }
      renderItem={({ item }) => {
        const label = `Level ${item.order}`;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.locked ? `${label}, locked` : label}
            accessibilityState={{ disabled: item.locked }}
            disabled={item.locked}
            onPress={() => onSelectLevel(item.id)}
            style={({ pressed }) => [
              styles.level,
              item.locked && styles.locked,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.levelName}>{label}</Text>
            {item.locked ? (
              <Text style={styles.detail}>Locked</Text>
            ) : showStars ? (
              <Text style={styles.detail}>
                {item.stars} of {maxStars} stars
              </Text>
            ) : item.completed ? (
              <Text style={styles.detail}>Completed</Text>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    gap: 12,
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  level: {
    minHeight: 56,
    padding: 14,
    borderRadius: 12,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    gap: 4,
  },
  locked: {
    backgroundColor: '#f1f5f9',
  },
  pressed: {
    backgroundColor: '#e2e8f0',
  },
  levelName: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
  },
  detail: {
    color: '#475569',
    fontSize: 14,
  },
});
