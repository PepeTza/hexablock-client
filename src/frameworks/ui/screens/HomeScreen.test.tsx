import { render, screen } from '@testing-library/react-native';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('should_show_suite_name_when_home_screen_renders', async () => {
    // Arrange / Act
    await render(<HomeScreen />);

    // Assert
    expect(
      screen.getByRole('header', { name: 'HexaBlock Suite' }),
    ).toBeTruthy();
  });
});
