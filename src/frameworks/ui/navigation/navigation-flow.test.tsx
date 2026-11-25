import { Pressable, Text, View } from 'react-native';

import { InMemoryProgressRepository } from '@adapters/persistence/in-memory-progress-repository';
import { Either } from '@application/common/either';
import type { ILevelSummary } from '@application/ports/level-repository';
import { emptyProgress, type GameId } from '@domain/progress/player-progress';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
import { ServicesProvider } from '../services/ServicesContext';
import { RootNavigator } from './RootNavigator';
import type { RootStackParamList } from './routes';

const TEST_LEVELS: Readonly<Record<GameId, readonly ILevelSummary[]>> = {
  'hexa-fit': [
    { id: 'fit-01', gameId: 'hexa-fit', order: 1 },
    { id: 'fit-02', gameId: 'hexa-fit', order: 2 },
  ],
  'hexa-sort': [
    { id: 'sort-01', gameId: 'hexa-sort', order: 1 },
    { id: 'sort-02', gameId: 'hexa-sort', order: 2 },
  ],
  'hexa-lines': [],
  'hexa-merge': [],
};

function createTestLevelRepository() {
  return {
    findByGame: (gameId: GameId) => Promise.resolve(TEST_LEVELS[gameId] ?? []),
  };
}

describe('Navigation flow (Home → level → game → result)', () => {
  it('should_navigate_from_home_through_fit_level_selection_to_victory_and_next_level', async () => {
    // Arrange
    const progress = new InMemoryProgressRepository();
    const services = createAppServices({
      progress,
      levels: createTestLevelRepository(),
    });

    function StubVariantScreen({
      navigation,
      route,
    }: NativeStackScreenProps<RootStackParamList, 'Variant'>) {
      return (
        <View>
          <Text>
            Playing {route.params.name} ({route.params.levelId ?? 'endless'})
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Complete level"
            onPress={() => {
              void progress
                .save({
                  ...emptyProgress('hexa-fit'),
                  levels: {
                    'fit-01': { completed: true, bestScore: 920, stars: 3 },
                  },
                })
                .then(() => {
                  navigation.replace('GameResult', {
                    gameId: route.params.gameId,
                    variantName: route.params.name,
                    levelId: route.params.levelId ?? null,
                    result: {
                      score: 920,
                      seed: null,
                      reason: 'victory',
                      isNewRecord: true,
                      stars: 3,
                      unlockedLevelId: 'fit-02',
                      saveFailed: false,
                    },
                  });
                });
            }}
          >
            <Text>Complete level</Text>
          </Pressable>
        </View>
      );
    }

    await render(
      <ServicesProvider services={services}>
        <RootNavigator variantComponent={StubVariantScreen} />
      </ServicesProvider>,
    );

    // Act 1: Home -> switch to list -> open Hexa Fit level selection
    await screen.findByRole('header', { name: 'HexaBlock Suite' });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Switch to list view' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Fit' }));

    // Assert 1: Level 2 is locked, Level 1 is unlocked
    expect(await screen.findByText('0 stars earned')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Level 2, locked' }),
    ).toBeDisabled();

    // Act 2: Locked press does not navigate; Level 1 opens the game
    await fireEvent.press(
      screen.getByRole('button', { name: 'Level 2, locked' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Level 1' }));

    // Assert 2: Variant screen receives fit-01
    expect(await screen.findByText('Playing Hexa Fit (fit-01)')).toBeTruthy();

    // Act 3: Complete level -> GameResult -> Next level -> verify fit-02
    await fireEvent.press(
      screen.getByRole('button', { name: 'Complete level' }),
    );
    expect(await screen.findByText('Score: 920')).toBeTruthy();
    expect(screen.getByText('Stars: 3 / 3')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Next level' }));
    expect(await screen.findByText('Playing Hexa Fit (fit-02)')).toBeTruthy();
  });

  it('should_navigate_from_home_through_sort_level_selection_to_defeat_retry_and_menu', async () => {
    // Arrange
    const services = createAppServices({
      levels: createTestLevelRepository(),
    });

    function StubSortScreen({
      navigation,
      route,
    }: NativeStackScreenProps<RootStackParamList, 'Variant'>) {
      return (
        <View>
          <Text>Sort level: {route.params.levelId}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trigger defeat"
            onPress={() =>
              navigation.replace('GameResult', {
                gameId: route.params.gameId,
                variantName: route.params.name,
                levelId: route.params.levelId ?? null,
                result: {
                  score: 120,
                  seed: 77,
                  reason: 'defeat',
                  isNewRecord: false,
                  stars: null,
                  unlockedLevelId: null,
                  saveFailed: false,
                },
              })
            }
          >
            <Text>Trigger defeat</Text>
          </Pressable>
        </View>
      );
    }

    await render(
      <ServicesProvider services={services}>
        <RootNavigator variantComponent={StubSortScreen} />
      </ServicesProvider>,
    );

    // Act: Home -> Hexa Sort -> Level 1 -> defeat -> Retry -> defeat -> Main menu
    await screen.findByRole('header', { name: 'HexaBlock Suite' });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Switch to list view' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Sort' }));

    expect(
      await screen.findByText('0 of 2 levels completed'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Level 1' }));
    expect(await screen.findByText('Sort level: sort-01')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Trigger defeat' }),
    );
    expect(await screen.findByText('Score: 120')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Sort level: sort-01')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Trigger defeat' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Main menu' }));

    // Assert
    expect(
      await screen.findByRole('header', { name: 'HexaBlock Suite' }),
    ).toBeTruthy();
  });

  it('should_skip_level_selection_for_endless_variants_and_return_to_menu', async () => {
    // Arrange
    const services = createAppServices({
      levels: createTestLevelRepository(),
    });

    function StubLinesScreen({
      navigation,
      route,
    }: NativeStackScreenProps<RootStackParamList, 'Variant'>) {
      return (
        <View>
          <Text>Endless: {route.params.name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finish run"
            onPress={() =>
              navigation.replace('GameResult', {
                gameId: route.params.gameId,
                variantName: route.params.name,
                levelId: null,
                result: {
                  score: 540,
                  seed: 42,
                  reason: 'defeat',
                  isNewRecord: true,
                  stars: null,
                  unlockedLevelId: null,
                  saveFailed: false,
                },
              })
            }
          >
            <Text>Finish run</Text>
          </Pressable>
        </View>
      );
    }

    await render(
      <ServicesProvider services={services}>
        <RootNavigator variantComponent={StubLinesScreen} />
      </ServicesProvider>,
    );

    // Act
    await screen.findByRole('header', { name: 'HexaBlock Suite' });
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Lines' }));
    expect(await screen.findByText('Endless: Hexa Lines')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Finish run' }));
    expect(await screen.findByText('Score: 540')).toBeTruthy();
    expect(screen.getByText('Seed: 42')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'New game' }));
    expect(await screen.findByText('Endless: Hexa Lines')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Finish run' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Main menu' }));

    // Assert
    expect(
      await screen.findByRole('header', { name: 'HexaBlock Suite' }),
    ).toBeTruthy();
  });

  it('should_recover_from_level_loading_error_when_try_again_is_pressed', async () => {
    // Arrange
    let fail = true;
    const base = createAppServices({ levels: createTestLevelRepository() });
    const services = {
      ...base,
      loadLevels: {
        execute: () =>
          Promise.resolve(
            fail
              ? Either.left(new Error('storage offline'))
              : Either.right({
                  levels: [
                    {
                      id: 'fit-01',
                      order: 1,
                      locked: false,
                      completed: false,
                      stars: 0,
                      bestScore: 0,
                    },
                  ],
                  completedLevels: 0,
                  totalStars: 0,
                }),
          ),
      },
    };

    await render(
      <ServicesProvider services={services}>
        <RootNavigator />
      </ServicesProvider>,
    );

    // Act
    await screen.findByRole('header', { name: 'HexaBlock Suite' });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Switch to list view' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Fit' }));

    expect(
      await screen.findByText(
        'Could not load levels. Check local storage and try again.',
      ),
    ).toBeTruthy();

    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    expect(
      await screen.findByRole('button', { name: 'Level 1' }),
    ).toBeOnTheScreen();
  });
});
