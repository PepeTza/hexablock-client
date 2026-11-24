import { StyleSheet, Text, View } from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/routes';

import { LinesGameScreen } from './LinesGameScreen';

type VariantPlaceholderScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Variant'
>;

/**
 * Placeholder destination for a game variant. Replaced by T13 (Hexa Lines),
 * T28 (level selection for Fit and Sort) and variant screens.
 */
export function VariantPlaceholderScreen({
  navigation,
  route,
}: VariantPlaceholderScreenProps) {
  if (route.params.gameId === 'hexa-lines') {
    return <LinesGameScreen navigation={navigation} route={route} />;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{route.params.name} is coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  message: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
});
