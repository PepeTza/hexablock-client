import { FitGamePresenter } from '@adapters/presentation/hexa-fit/fit-game-presenter';
import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
import { FIT_DEMO_FACTORY, FIT_DEMO_ID } from '../../fit-demo';
import type { RootStackParamList } from '../navigation/routes';
import { ServicesProvider } from '../services/ServicesContext';
import { FitGameScreen } from './FitGameScreen';
import { GameResultScreen } from './GameResultScreen';
import { SettingsScreen } from './SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

it('should_show_the_saved_victory_when_the_player_returns_from_settings', async () => {
  // Arrange
  const navigation = createNavigationContainerRef<RootStackParamList>();
  let release: () => void = () => undefined;
  const pending = new Promise<Either<Error, FinishGameOutput>>((resolve) => {
    release = () =>
      resolve(
        Either.right({
          score: 980,
          seed: null,
          reason: 'victory',
          isNewRecord: true,
          stars: 3,
          unlockedLevelId: null,
          saveFailed: false,
        }),
      );
  });
  const execute = jest.fn(() => pending);
  const services = {
    ...createAppServices(),
    startFit: () =>
      new FitGamePresenter(
        FIT_DEMO_FACTORY.createEngine(),
        FIT_DEMO_ID,
        { execute },
        () => 0,
      ),
  };
  await render(
    <ServicesProvider services={services}>
      <NavigationContainer ref={navigation}>
        <Stack.Navigator>
          <Stack.Screen
            name="Variant"
            component={FitGameScreen}
            initialParams={{ gameId: 'hexa-fit', name: 'Hexa Fit' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="GameResult" component={GameResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ServicesProvider>,
  );
  const press = (name: string) =>
    fireEvent.press(screen.getByRole('button', { name }));

  // Act
  await press('Piece 1');
  await press('Rotate');
  await press('Cell 0,0');
  await press('Piece 2');
  await press('Cell 1,0');
  expect(execute).toHaveBeenCalledTimes(1);
  await act(() => navigation.navigate('Settings'));
  await screen.findByText('Settings are coming soon.');
  await act(async () => {
    release();
    await pending;
  });

  // Assert
  expect(navigation.getCurrentRoute()?.name).toBe('Settings');
  await act(() => navigation.goBack());
  expect(await screen.findByText('Victory!')).toBeTruthy();
  expect(execute).toHaveBeenCalledTimes(1);
});
