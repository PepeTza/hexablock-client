import { expect, it, vi } from 'vitest';

import { HttpSeedConfigRepository } from './http-seed-config-repository';

const base = 'https://example.test/api/v1/';
const token = 'synthetic-token';

it('should_read_each_sort_level_when_the_api_returns_a_list', async () => {
  // Arrange
  const mock = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      gameId: 'hexa-sort',
      levels: [{ levelId: 'sort-1', config: { mode: 'fixed', value: 0 } }],
    }),
  );
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.read('hexa-sort');

  // Assert
  expect(mock).toHaveBeenCalledWith(base + 'seed-config/hexa-sort');
  expect(result).toMatchObject({
    kind: 'right',
    value: [{ levelId: 'sort-1', config: { mode: 'fixed', value: 0 } }],
  });
});

it('should_keep_the_level_scoped_update_for_sort_when_saving', async () => {
  // Arrange
  const mock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(null, { status: 200 }));
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.save(
    { gameId: 'hexa-sort', levelId: 'a&b' },
    { mode: 'fixed', value: 42 },
  );

  // Assert
  expect(result.kind).toBe('right');
  expect(mock).toHaveBeenCalledWith(
    base + 'seed-config/hexa-sort?levelId=a%26b',
    {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: '{"mode":"fixed","value":42}',
    },
  );
});

it('should_keep_a_denied_response_when_the_server_returns_403', async () => {
  // Arrange
  const mock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(null, { status: 403 }));
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.save(
    { gameId: 'hexa-lines' },
    { mode: 'random' },
  );

  // Assert
  expect(result).toMatchObject({ kind: 'left', value: { code: 'forbidden' } });
});

it('should_reject_a_malformed_fixed_seed_when_reading_settings', async () => {
  // Arrange
  const mock = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      gameId: 'hexa-lines',
      config: { mode: 'fixed', value: 2 ** 32 },
    }),
  );
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.read('hexa-lines');

  // Assert
  expect(result).toMatchObject({
    kind: 'left',
    value: { code: 'unavailable' },
  });
});

it('should_accept_default_random_with_null_updated_at_when_reading_a_game', async () => {
  // Arrange
  const mock = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      gameId: 'hexa-lines',
      config: { mode: 'random' },
      updatedAt: null,
    }),
  );
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.read('hexa-lines');

  // Assert
  expect(result).toMatchObject({
    kind: 'right',
    value: [{ levelId: null, config: { mode: 'random' } }],
  });
});

it('should_accept_the_updated_json_body_when_saving_a_game_seed', async () => {
  // Arrange
  const mock = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      gameId: 'hexa-lines',
      config: { mode: 'fixed', value: 4294967295 },
      updatedAt: '2026-11-26T12:00:00.000Z',
    }),
  );
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.save(
    { gameId: 'hexa-lines' },
    { mode: 'fixed', value: 4294967295 },
  );

  // Assert
  expect(result.kind).toBe('right');
  expect(mock).toHaveBeenCalledWith(base + 'seed-config/hexa-lines', {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: '{"mode":"fixed","value":4294967295}',
  });
});

it.each([
  [400, 'invalid-input'],
  [401, 'forbidden'],
  [404, 'not-found'],
])('should_map_status_%s_when_saving_fails', async (status, expectedCode) => {
  // Arrange
  const mock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(null, { status }));
  const repository = new HttpSeedConfigRepository(base, token, mock);

  // Act
  const result = await repository.save(
    { gameId: 'hexa-lines' },
    { mode: 'random' },
  );

  // Assert
  expect(result).toMatchObject({
    kind: 'left',
    value: { code: expectedCode },
  });
});
