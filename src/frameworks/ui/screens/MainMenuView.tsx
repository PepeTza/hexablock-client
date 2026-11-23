import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  DEFAULT_SWIPE_THRESHOLD,
  resolveCarouselSwipe,
  stepCarouselIndex,
  toggleMenuMode,
} from '@adapters/presentation/main-menu/main-menu-presenter';
import type {
  CarouselStep,
  MainMenuMode,
  MainMenuViewModel,
} from '@adapters/presentation/main-menu/main-menu-view-model';
import type { GameId } from '@domain/progress/player-progress';

/** Props for the passive `MainMenuView`. */
export interface MainMenuViewProps {
  readonly viewModel: MainMenuViewModel;
  readonly onSelectVariant: (gameId: GameId, name: string) => void;
  readonly onOpenSettings: () => void;
}

/**
 * Passive view (Humble View): renders the suite title, configured variants in
 * a circular carousel (default) or list mode, and access to settings without
 * holding business or navigation logic (#117).
 */
export function MainMenuView({
  viewModel,
  onSelectVariant,
  onOpenSettings,
}: MainMenuViewProps) {
  const [mode, setMode] = useState<MainMenuMode>('carousel');
  const [activeIndex, setActiveIndex] = useState(0);
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const count = viewModel.variants.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;
  const activeVariant = viewModel.variants[safeIndex];

  const moveCarousel = useCallback(
    (step: CarouselStep) => {
      setActiveIndex((current) => stepCarouselIndex(current, count, step));
      cardOpacity.setValue(0.75);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    },
    [cardOpacity, count],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) >= DEFAULT_SWIPE_THRESHOLD &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_event, gestureState) => {
          const step = resolveCarouselSwipe(gestureState.dx);
          if (step !== 0) {
            moveCarousel(step);
          }
        },
      }),
    [moveCarousel],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {viewModel.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'carousel'
              ? 'Switch to list view'
              : 'Switch to carousel view'
          }
          onPress={() => setMode((current) => toggleMenuMode(current))}
          style={({ pressed }) => [
            styles.modeToggle,
            pressed && styles.modeTogglePressed,
          ]}
        >
          <Text style={styles.modeToggleIcon}>
            {mode === 'carousel' ? '☰' : '◫'}
          </Text>
        </Pressable>
      </View>

      {mode === 'carousel' && activeVariant !== undefined ? (
        <View style={styles.carouselSection}>
          <View style={styles.carouselRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous variant"
              onPress={() => moveCarousel(-1)}
              style={({ pressed }) => [
                styles.arrowButton,
                pressed && styles.arrowButtonPressed,
              ]}
            >
              <Text style={styles.arrowLabel}>‹</Text>
            </Pressable>

            <Animated.View
              testID="carousel-card-wrapper"
              style={[styles.carouselCardWrapper, { opacity: cardOpacity }]}
              {...panResponder.panHandlers}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={activeVariant.name}
                accessibilityHint={activeVariant.progressLabel ?? undefined}
                onPress={() =>
                  onSelectVariant(activeVariant.gameId, activeVariant.name)
                }
                style={({ pressed }) => [
                  styles.carouselCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <Text style={styles.variantName}>{activeVariant.name}</Text>

                {/* Placeholder until live engine demos arrive in issue #118. */}
                <View
                  style={styles.demoPlaceholder}
                  accessibilityLabel={`${activeVariant.name} demo placeholder`}
                >
                  <Text style={styles.demoHex}>⬡</Text>
                  <Text style={styles.demoPlaceholderText}>
                    Demo coming soon
                  </Text>
                </View>

                {activeVariant.progressLabel !== null && (
                  <Text style={styles.progressLabel}>
                    {activeVariant.progressLabel}
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next variant"
              onPress={() => moveCarousel(1)}
              style={({ pressed }) => [
                styles.arrowButton,
                pressed && styles.arrowButtonPressed,
              ]}
            >
              <Text style={styles.arrowLabel}>›</Text>
            </Pressable>
          </View>

          <View style={styles.dotsRow}>
            {viewModel.variants.map((variant, index) => (
              <Text
                key={variant.gameId}
                style={
                  index === safeIndex ? styles.dotActive : styles.dotInactive
                }
              >
                {index === safeIndex ? '●' : '○'}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {viewModel.variants.map((variant) => (
            <Pressable
              key={variant.gameId}
              accessibilityRole="button"
              accessibilityLabel={variant.name}
              accessibilityHint={variant.progressLabel ?? undefined}
              onPress={() => onSelectVariant(variant.gameId, variant.name)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.variantName}>{variant.name}</Text>
              {variant.progressLabel !== null && (
                <Text style={styles.progressLabel}>
                  {variant.progressLabel}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  modeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  modeTogglePressed: {
    backgroundColor: '#e2e8f0',
  },
  modeToggleIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  carouselSection: {
    gap: 16,
    alignItems: 'center',
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  arrowButton: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    borderRadius: 10,
  },
  arrowButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  arrowLabel: {
    fontSize: 28,
    fontWeight: '600',
    color: '#334155',
  },
  carouselCardWrapper: {
    flex: 1,
  },
  carouselCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 14,
  },
  demoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  demoHex: {
    fontSize: 32,
    color: '#64748b',
  },
  demoPlaceholderText: {
    fontSize: 13,
    color: '#64748b',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotActive: {
    fontSize: 12,
    color: '#0f172a',
  },
  dotInactive: {
    fontSize: 12,
    color: '#94a3b8',
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
