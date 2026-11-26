import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { FitLevelEditor } from './FitLevelEditor';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

it('should_show_the_solution_when_the_figure_and_piece_match', () => {
  // Arrange
  render(<FitLevelEditor />);

  // Act
  fireEvent.click(screen.getByRole('button', { name: 'Cell 0,0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

  // Assert
  expect(screen.getByText('Solution found')).toBeTruthy();
  expect(screen.getByRole('img', { name: 'Fit solution' })).toBeTruthy();
});

it('should_explain_the_failure_when_the_piece_area_is_too_small', () => {
  // Arrange
  render(<FitLevelEditor />);

  // Act
  fireEvent.click(screen.getByRole('button', { name: 'Cell 0,0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cell 1,0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
  fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

  // Assert
  expect(screen.getByRole('alert').textContent).toContain('Total piece area');
  expect(screen.queryByRole('img', { name: 'Fit solution' })).toBeNull();
});

it('should_restore_the_figure_and_pieces_when_the_editor_reopens', () => {
  // Arrange
  const editor = render(<FitLevelEditor />);
  fireEvent.click(screen.getByRole('button', { name: 'Cell 0,0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));

  // Act
  editor.unmount();
  render(<FitLevelEditor />);

  // Assert
  expect(
    screen
      .getByRole('button', { name: 'Cell 0,0' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
  expect(
    screen.getByRole('button', { name: 'Remove p1-01 (piece 1)' }),
  ).toBeTruthy();
});
