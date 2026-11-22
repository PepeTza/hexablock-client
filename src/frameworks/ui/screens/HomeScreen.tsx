import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { MainMenuViewModel } from '@adapters/presentation/main-menu/main-menu-view-model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';
import { MainMenuView } from './MainMenuView';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Main menu container screen: loads the view model from `MainMenuPresenter`
 * and forwards user actions to React Navigation.
 */
export function HomeScreen({ navigation }: HomeScreenProps) {
  const { mainMenu } = useServices();
  const [viewModel, setViewModel] = useState<MainMenuViewModel | null>(null);

  useEffect(() => {
    let active = true;
    void mainMenu.load().then((loaded) => {
      if (active) {
        setViewModel(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [mainMenu]);

  if (viewModel === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading menu" />
      </View>
    );
  }

  return (
    <MainMenuView
      viewModel={viewModel}
      onSelectVariant={(gameId, name) =>
        navigation.navigate('Variant', { gameId, name })
      }
      onOpenSettings={() => navigation.navigate('Settings')}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});
