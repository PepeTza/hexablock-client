import { fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
import { ServicesProvider } from '../services/ServicesContext';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator', () => {
  it('should_open_settings_screen_when_settings_pressed_from_home', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await screen.findByRole('header', { name: 'HexaBlock Suite' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));

    // Assert
    expect(await screen.findByText('Settings are coming soon.')).toBeTruthy();
  });

  it('should_open_variant_placeholder_when_variant_pressed_from_home', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await screen.findByRole('header', { name: 'HexaBlock Suite' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Lines' }));

    // Assert
    expect(await screen.findByText('Hexa Lines is coming soon.')).toBeTruthy();
  });
});
