import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { LevelSelection } from '@application/use-cases/load-levels';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';
import { LevelSelectionView } from './LevelSelectionView';

type LevelSelectionScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'LevelSelection'
>;

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly selection: LevelSelection };

const EMPTY_SELECTION: LevelSelection = {
  levels: [],
  completedLevels: 0,
  totalStars: 0,
};

/**
 * Container screen for level selection (RF-15, CU-08): loads ordered levels
 * and progress on focus and forwards unlocked selections to the variant route.
 */
export function LevelSelectionScreen({
  navigation,
  route,
}: LevelSelectionScreenProps) {
  const { loadLevels } = useServices();
  const { gameId, name, showStars } = route.params;
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const fetchLevels = useCallback(() => {
    if (loadLevels === undefined) {
      setState({ kind: 'ready', selection: EMPTY_SELECTION });
      return () => undefined;
    }
    let active = true;
    void loadLevels.execute({ gameId }).then((outcome) => {
      if (!active) return;
      if (outcome.isLeft()) {
        setState({
          kind: 'error',
          message: 'Could not load levels. Check local storage and try again.',
        });
        return;
      }
      setState({ kind: 'ready', selection: outcome.value });
    });
    return () => {
      active = false;
    };
  }, [gameId, loadLevels]);

  useFocusEffect(fetchLevels);

  if (state.kind === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          accessibilityLabel="Loading levels"
          color="#1e293b"
        />
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {state.message}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={() => {
              setState({ kind: 'loading' });
              fetchLevels();
            }}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <LevelSelectionView
      title={name}
      showStars={showStars}
      selection={state.selection}
      onSelectLevel={(levelId) =>
        navigation.navigate('Variant', { gameId, name, levelId })
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  errorCard: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#ffffff',
    gap: 14,
    alignItems: 'center',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    minHeight: 48,
    minWidth: 140,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    backgroundColor: '#334155',
  },
  retryLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
