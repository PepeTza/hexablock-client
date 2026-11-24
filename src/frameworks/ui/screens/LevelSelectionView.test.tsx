import { fireEvent, render, screen } from '@testing-library/react-native';

import { LevelSelectionView } from './LevelSelectionView';

const selection = {
  levels: [
    {
      id: 'level-1',
      order: 1,
      locked: false,
      completed: true,
      stars: 3,
      bestScore: 800,
    },
    {
      id: 'level-2',
      order: 2,
      locked: false,
      completed: false,
      stars: 0,
      bestScore: 0,
    },
    {
      id: 'level-3',
      order: 3,
      locked: true,
      completed: false,
      stars: 0,
      bestScore: 0,
    },
  ],
  completedLevels: 1,
  totalStars: 3,
};

describe('LevelSelectionView', () => {
  it('should_show_earned_stars_and_open_only_unlocked_fit_levels', async () => {
    // Arrange
    const onSelectLevel = jest.fn();
    await render(
      <LevelSelectionView
        title="Hexa Fit"
        showStars
        selection={selection}
        onSelectLevel={onSelectLevel}
      />,
    );

    // Act
    await fireEvent.press(
      screen.getByRole('button', { name: 'Level 3, locked' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Level 2' }));

    // Assert
    expect(screen.getByText('3 stars earned')).toBeOnTheScreen();
    expect(screen.getByText('3 of 3 stars')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Level 3, locked' }),
    ).toBeDisabled();
    expect(onSelectLevel).toHaveBeenCalledTimes(1);
    expect(onSelectLevel).toHaveBeenCalledWith('level-2');
  });

  it('should_show_completion_without_stars_when_the_variant_tracks_levels', async () => {
    // Arrange & Act
    await render(
      <LevelSelectionView
        title="Hexa Sort"
        showStars={false}
        selection={selection}
        onSelectLevel={() => undefined}
      />,
    );

    // Assert
    expect(screen.getByRole('header', { name: 'Hexa Sort' })).toBeOnTheScreen();
    expect(screen.getByText('1 of 3 levels completed')).toBeOnTheScreen();
    expect(screen.getByText('Completed')).toBeOnTheScreen();
    expect(screen.queryByText('3 of 3 stars')).toBeNull();
  });
});

it('should_use_the_configured_star_limit_when_the_variant_exposes_it', async () => {
  // Arrange & Act
  await render(
    <LevelSelectionView
      title="Hexa Fit"
      showStars
      maxStars={5}
      selection={selection}
      onSelectLevel={() => undefined}
    />,
  );

  // Assert
  expect(screen.getByText('3 of 5 stars')).toBeOnTheScreen();
});
