import { HttpSeedConfigReader } from './http-seed-config-reader';

const base = 'https://example.test/api/v1/';

it('should_return_a_fixed_seed_when_the_lines_configuration_is_available', async () => {
  // Arrange
  const request = jest.fn().mockResolvedValue(
    Response.json({
      gameId: 'hexa-lines',
      config: { mode: 'fixed', value: 0 },
    }),
  );
  const repository = new HttpSeedConfigReader(base, request);

  // Act
  const result = await repository.findSeedConfig('hexa-lines');

  // Assert
  expect(result).toEqual({ mode: 'fixed', value: 0 });
  expect(request).toHaveBeenCalledWith(base + 'seed-config/hexa-lines');
});

it('should_use_only_the_chosen_level_when_sort_returns_multiple_configurations', async () => {
  // Arrange
  const request = jest.fn().mockResolvedValue(
    Response.json({
      gameId: 'hexa-sort',
      levels: [
        { levelId: 'first', config: { mode: 'fixed', value: 42 } },
        { levelId: 'second', config: { mode: 'random' } },
      ],
    }),
  );
  const repository = new HttpSeedConfigReader(base, request);

  // Act
  const result = await repository.findSeedConfig('hexa-sort', 'second');

  // Assert
  expect(result).toEqual({ mode: 'random' });
});

it('should_return_no_configuration_when_the_network_is_unavailable', async () => {
  // Arrange
  const request = jest.fn().mockRejectedValue(new Error('Offline'));
  const repository = new HttpSeedConfigReader(base, request);

  // Act
  const result = await repository.findSeedConfig('hexa-lines');

  // Assert
  expect(result).toBeNull();
});

it('should_skip_the_request_when_the_game_does_not_use_a_seed', async () => {
  // Arrange
  const request = jest.fn();
  const repository = new HttpSeedConfigReader(base, request);

  // Act
  const result = await repository.findSeedConfig('hexa-fit');

  // Assert
  expect(result).toBeNull();
  expect(request).not.toHaveBeenCalled();
});
