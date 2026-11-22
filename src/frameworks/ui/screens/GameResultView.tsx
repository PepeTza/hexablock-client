import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { GameResultViewModel } from '@adapters/presentation/game-result/game-result-view-model';

/** Props for the passive `GameResultView`. */
export interface GameResultViewProps {
  readonly viewModel: GameResultViewModel;
  readonly onRetry: () => void;
  readonly onNextLevel: (nextLevelId: string) => void;
  readonly onNewGame: () => void;
  readonly onBackToMenu: () => void;
}

/**
 * Passive view (Humble View): renders the victory or defeat outcome, final
 * score, optional seed/stars/record/warning labels and post-game actions
 * without holding business or navigation logic (RF-16, CU-07).
 */
export function GameResultView({
  viewModel,
  onRetry,
  onNextLevel,
  onNewGame,
  onBackToMenu,
}: GameResultViewProps) {
  const { nextLevelId } = viewModel;
  const isVictory = viewModel.outcome === 'victory';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.variantName}>{viewModel.variantName}</Text>
      <Text
        accessibilityRole="header"
        style={[
          styles.title,
          isVictory ? styles.victoryTitle : styles.defeatTitle,
        ]}
      >
        {viewModel.title}
      </Text>

      <View style={styles.card}>
        <Text style={styles.scoreLabel}>{viewModel.scoreLabel}</Text>
        {viewModel.newRecordLabel !== null && (
          <Text style={styles.recordLabel}>{viewModel.newRecordLabel}</Text>
        )}
        {viewModel.starsLabel !== null && (
          <Text style={styles.detailLabel}>{viewModel.starsLabel}</Text>
        )}
        {viewModel.seedLabel !== null && (
          <Text style={styles.seedLabel}>{viewModel.seedLabel}</Text>
        )}
      </View>

      {viewModel.warningLabel !== null && (
        <View style={styles.warningBanner}>
          <Text accessibilityRole="alert" style={styles.warningLabel}>
            {viewModel.warningLabel}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {nextLevelId !== null && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next level"
            onPress={() => onNextLevel(nextLevelId)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryLabel}>Next level</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>Retry</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New game"
          onPress={onNewGame}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
        >
          <Text style={styles.secondaryLabel}>New game</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Main menu"
          onPress={onBackToMenu}
          style={({ pressed }) => [
            styles.tertiaryButton,
            pressed && styles.tertiaryButtonPressed,
          ]}
        >
          <Text style={styles.tertiaryLabel}>Main menu</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    backgroundColor: '#f8fafc',
    gap: 20,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#475569',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  victoryTitle: {
    color: '#15803d',
  },
  defeatTitle: {
    color: '#b91c1c',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  recordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  seedLabel: {
    fontSize: 14,
    color: '#475569',
  },
  warningBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  warningLabel: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: '#334155',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tertiaryButtonPressed: {
    opacity: 0.7,
  },
  tertiaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
});
