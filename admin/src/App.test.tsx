import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LoginUseCase } from '@application/use-cases/login';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { HttpAuthService } from './http-auth-service';

const apiBaseUrl = 'http://localhost:3000/api/v1/';

function loginResponse(role: string, tokenRole = role) {
  return new Response(
    JSON.stringify({
      accessToken:
        'header.' +
        btoa(JSON.stringify({ role: tokenRole })).replace(/=+$/, '') +
        '.signature',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 'test-id', username: 'test_admin', role },
    }),
    { status: 200 },
  );
}

function renderPanel(request = vi.fn<typeof fetch>()) {
  render(
    <App
      login={
        new LoginUseCase(new HttpAuthService(apiBaseUrl, request), 'admin')
      }
    />,
  );
  return request;
}

function submit() {
  fireEvent.change(screen.getByLabelText('Username'), {
    target: { value: 'test_admin' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'synthetic-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

afterEach(cleanup);

describe('App', () => {
  it('should_hide_admin_content_when_signed_out', () => {
    // Arrange / Act
    const request = renderPanel();

    // Assert
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByText(/cells/)).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('should_show_the_cell_count_of_a_radius_4_board_when_rendered_for_an_admin', async () => {
    // Arrange
    const request = renderPanel(
      vi.fn<typeof fetch>().mockResolvedValue(loginResponse('admin')),
    );

    // Act
    submit();
    const text = await screen.findByText(/cells/);

    // Assert
    expect(text.textContent).toBe('A radius-4 board has 61 cells.');
    expect(request).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'test_admin',
          password: 'synthetic-password',
        }),
      }),
    );
  });

  it.each([
    ['player', 'player'],
    ['admin', 'player'],
  ])(
    'should_deny_entry_when_response_role_is_%s_and_jwt_role_is_%s',
    async (role, tokenRole) => {
      // Arrange
      renderPanel(
        vi.fn<typeof fetch>().mockResolvedValue(loginResponse(role, tokenRole)),
      );

      // Act
      submit();
      const alert = await screen.findByRole('alert');

      // Assert
      expect(alert.textContent).toBe(
        'This account cannot access the admin panel.',
      );
      expect(screen.queryByText(/cells/)).toBeNull();
    },
  );

  it.each([
    [400, 'Check the username and password format.'],
    [401, 'Invalid username or password.'],
    [429, 'Too many attempts. Try again later.'],
    [503, 'Unable to sign in. Try again later.'],
  ])(
    'should_show_a_local_error_when_login_returns_%s',
    async (status, message) => {
      // Arrange
      renderPanel(
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(new Response('Internal detail', { status })),
      );

      // Act
      submit();
      const alert = await screen.findByRole('alert');

      // Assert
      expect(alert.textContent).toBe(message);
      expect(screen.queryByText(/cells/)).toBeNull();
    },
  );

  it('should_return_to_an_empty_login_when_the_admin_signs_out', async () => {
    // Arrange
    renderPanel(
      vi.fn<typeof fetch>().mockResolvedValue(loginResponse('admin')),
    );
    submit();

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    // Assert
    expect(screen.queryByText(/cells/)).toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>('Password').value).toBe('');
  });
});
