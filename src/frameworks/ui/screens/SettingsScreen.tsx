import { StyleSheet, Text, View } from 'react-native';

/**
 * Placeholder settings screen. Replaced by HU05 and HU06 with audio toggles
 * and language selection.
 */
export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Settings are coming soon.</Text>
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
