import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('should_show_the_cell_count_of_a_radius_4_board_when_rendered', () => {
    // Arrange
    render(<App />);

    // Act
    const text = screen.getByText(/cells/);

    // Assert
    expect(text.textContent).toBe('A radius-4 board has 61 cells.');
  });
});
