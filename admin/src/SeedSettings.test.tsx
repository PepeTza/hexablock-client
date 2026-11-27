import {
  LoadSeedConfigsUseCase,
  SaveSeedConfigUseCase,
} from '@application/use-cases/seed-settings';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpSeedConfigRepository } from './http-seed-config-repository';
import { SeedSettings } from './SeedSettings';

const apiBaseUrl = 'http://localhost:3000/api/v1/';
const token = 'synthetic-admin-token';

afterEach(cleanup);

function renderSeedSettings(request: typeof fetch) {
  const repository = new HttpSeedConfigRepository(apiBaseUrl, token, request);
  render(
    <SeedSettings
      load={new LoadSeedConfigsUseCase(repository)}
      save={new SaveSeedConfigUseCase(repository)}
    />,
  );
}

describe('SeedSettings', () => {
  it('should_load_default_random_and_save_a_fixed_seed_when_admin_submits', async () => {
    // Arrange
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          gameId: 'hexa-lines',
          config: { mode: 'random' },
          updatedAt: null,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          gameId: 'hexa-lines',
          config: { mode: 'fixed', value: 1739201 },
          updatedAt: '2026-11-26T12:00:00.000Z',
        }),
      );
    renderSeedSettings(request);
    await screen.findByRole('button', { name: 'Save seed' });

    // Act
    fireEvent.change(screen.getByLabelText('Mode'), {
      target: { value: 'fixed' },
    });
    fireEvent.change(screen.getByLabelText('Fixed seed'), {
      target: { value: '1739201' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save seed' }));

    // Assert
    const status = await screen.findByRole('status');
    expect(status.textContent).toBe('Seed settings saved.');
    expect(screen.getByText('Fixed · 1739201')).toBeTruthy();
    expect(request).toHaveBeenLastCalledWith(
      apiBaseUrl + 'seed-config/hexa-lines',
      expect.objectContaining({
        method: 'PUT',
        body: '{"mode":"fixed","value":1739201}',
      }),
    );
  });

  it('should_load_sort_levels_and_save_selected_level_when_switching_to_hexa_sort', async () => {
    // Arrange
    const levelA = '9c4e0000-0000-4000-8000-000000000001';
    const levelB = '9c4e0000-0000-4000-8000-000000000002';
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          gameId: 'hexa-lines',
          config: { mode: 'random' },
          updatedAt: null,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          gameId: 'hexa-sort',
          levels: [
            { levelId: levelA, config: { mode: 'random' }, updatedAt: null },
            {
              levelId: levelB,
              config: { mode: 'fixed', value: 42 },
              updatedAt: '2026-11-26T12:00:00.000Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          gameId: 'hexa-sort',
          levels: [
            {
              levelId: levelB,
              config: { mode: 'random' },
              updatedAt: '2026-11-26T12:05:00.000Z',
            },
          ],
        }),
      );
    renderSeedSettings(request);
    await screen.findByRole('button', { name: 'Save seed' });

    // Act
    fireEvent.change(screen.getByLabelText('Game'), {
      target: { value: 'hexa-sort' },
    });
    const levelSelect = await screen.findByLabelText('Level');
    fireEvent.change(levelSelect, { target: { value: levelB } });
    expect(screen.getByLabelText<HTMLInputElement>('Fixed seed').value).toBe(
      '42',
    );
    fireEvent.change(screen.getByLabelText('Mode'), {
      target: { value: 'random' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save seed' }));

    // Assert
    expect((await screen.findByRole('status')).textContent).toBe(
      'Seed settings saved.',
    );
    expect(request).toHaveBeenLastCalledWith(
      apiBaseUrl +
        'seed-config/hexa-sort?levelId=' +
        encodeURIComponent(levelB),
      expect.objectContaining({
        method: 'PUT',
        body: '{"mode":"random"}',
      }),
    );
  });
});
