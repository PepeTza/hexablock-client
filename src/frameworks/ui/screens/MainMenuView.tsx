import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MainMenuViewModel } from '@adapters/presentation/main-menu/main-menu-view-model';
import type { GameId } from '@domain/progress/player-progress';

/** Props for the passive `MainMenuView`. */
export interface MainMenuViewProps {
  readonly viewModel: MainMenuViewModel;
  readonly onSelectVariant: (gameId: GameId, name: string) => void;
  readonly onOpenSettings: () => void;
}

/**
 * Passive view (Humble View): renders the suite title, configured variants
 * with their progress summaries and access to settings without holding
 * business or navigation logic.
 */
export function MainMenuView({
  viewModel,
  onSelectVariant,
  onOpenSettings,
}: MainMenuViewProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {viewModel.title}
      </Text>

      <View style={styles.list}>
        {viewModel.variants.map((variant) => (
          <Pressable
            key={variant.gameId}
            accessibilityRole="button"
            accessibilityLabel={variant.name}
            accessibilityHint={variant.progressLabel}
            onPress={() => onSelectVariant(variant.gameId, variant.name)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.variantName}>{variant.name}</Text>
            <Text style={styles.progressLabel}>{variant.progressLabel}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && styles.settingsButtonPressed,
        ]}
      >
        <Text style={styles.settingsLabel}>Settings</Text>
      </Pressable>
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
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
  },
  list: {
    gap: 12,
  },
  card: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    gap: 4,
  },
  cardPressed: {
    backgroundColor: '#e2e8f0',
  },
  variantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  progressLabel: {
    fontSize: 14,
    color: '#475569',
  },
  settingsButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  settingsButtonPressed: {
    backgroundColor: '#334155',
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
