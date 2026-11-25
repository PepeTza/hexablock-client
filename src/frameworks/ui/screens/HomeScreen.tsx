import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { MainMenuViewModel } from '@adapters/presentation/main-menu/main-menu-view-model';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/routes';
import { useServices } from '../services/ServicesContext';
import { MainMenuView } from './MainMenuView';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Main menu container screen: loads the view model from `MainMenuPresenter`
 * and forwards user actions to React Navigation.
 *
 * The menu stays mounted under the other screens of the stack, so it reloads
 * every time it becomes visible again (`useFocusEffect`), not only when it is
 * first created: coming back from a game shows the new record. The spinner
 * appears only on the first load; on later visits the previous menu stays on
 * screen while it reloads.
 */
export function HomeScreen({ navigation }: HomeScreenProps) {
  const { mainMenu } = useServices();
  const [viewModel, setViewModel] = useState<MainMenuViewModel | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void mainMenu.load().then((loaded) => {
        if (active) {
          setViewModel(loaded);
        }
      });
      return () => {
        active = false;
      };
    }, [mainMenu]),
  );

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
      onSelectVariant={(gameId, name) => {
        const entry = MENU_VARIANTS.find(
          (variant) => variant.gameId === gameId,
        );
        if (entry?.progressKind === 'levels') {
          navigation.navigate('LevelSelection', {
            gameId,
            name,
            showStars: entry.showStars ?? false,
          });
          return;
        }
        navigation.navigate('Variant', { gameId, name });
      }}
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
