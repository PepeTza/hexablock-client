import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { GameResultPresenter } from '@adapters/presentation/game-result/game-result-presenter';
import { MainMenuPresenter } from '@adapters/presentation/main-menu/main-menu-presenter';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';
import type {
  LoadProgressSummaryInput,
  ProgressSummary,
} from '@application/use-cases/load-progress-summary';
import type { IUseCase } from '@application/use-cases/use-case';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AppServices } from '../../composition-root';
import type { RootStackParamList } from '../navigation/routes';
import { ServicesProvider } from '../services/ServicesContext';
import { HomeScreen } from './HomeScreen';

type LoadSummary = IUseCase<
  LoadProgressSummaryInput,
  Promise<readonly ProgressSummary[]>
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function ElsewhereScreen() {
  return <Text>Somewhere else</Text>;
}

/**
 * A minimal stack with the menu at the bottom and one screen above it, and a
 * navigation reference to go there and come back (the header's back button
 * is not a pressable button in tests).
 */
async function renderMenu(loadSummary: LoadSummary) {
  const navigation = createNavigationContainerRef<RootStackParamList>();
  const services: AppServices = {
    mainMenu: new MainMenuPresenter(loadSummary, MENU_VARIANTS),
    gameResult: new GameResultPresenter(),
    startLines: () => {
      throw new Error('This screen does not start sessions');
    },
  };
  await render(
    <ServicesProvider services={services}>
      <NavigationContainer ref={navigation}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Settings" component={ElsewhereScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ServicesProvider>,
  );
  return navigation;
}

describe('HomeScreen', () => {
  it('should_show_the_new_record_when_coming_back_to_the_menu', async () => {
    // Arrange
    let record = 0;
    const loadSummary: LoadSummary = {
      execute: () =>
        Promise.resolve([
          { gameId: 'hexa-lines', highScore: record, completedLevels: 0 },
          { gameId: 'hexa-merge', highScore: 512, completedLevels: 0 },
        ]),
    };
    const navigation = await renderMenu(loadSummary);
    expect(await screen.findByText('Best: 0')).toBeTruthy();
    await act(() => {
      navigation.navigate('Settings');
    });
    await screen.findByText('Somewhere else');
    record = 1200;

    // Act
    await act(() => {
      navigation.goBack();
    });

    // Assert
    expect(await screen.findByText('Best: 1200')).toBeTruthy();
  });

  it('should_show_the_menu_when_loading_progress_fails', async () => {
    // Arrange
    const loadSummary: LoadSummary = {
      execute: () => Promise.reject(new Error('storage unavailable')),
    };

    // Act
    await renderMenu(loadSummary);
    expect(
      await screen.findByRole('button', { name: 'Hexa Lines' }),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Switch to list view' }),
    );

    // Assert
    for (const entry of MENU_VARIANTS) {
      expect(
        await screen.findByRole('button', { name: entry.name }),
      ).toBeTruthy();
    }
    expect(screen.queryByLabelText('Loading menu')).toBeNull();
  });
});
