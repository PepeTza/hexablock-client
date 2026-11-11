import { StyleSheet, Text, View } from 'react-native';

export const SUITE_NAME = 'HexaBlock Suite';

/**
 * Placeholder home screen: shows the suite name so the project can be run and
 * tested end to end. The real menu (HU01) replaces its content.
 */
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {SUITE_NAME}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});
