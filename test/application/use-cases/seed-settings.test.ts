import { Either } from '@application/common/either';
import {
  SeedSettingsError,
  type IAdminSeedConfigRepository,
} from '@application/ports/admin-seed-config-repository';
import {
  LoadSeedConfigsUseCase,
  SaveSeedConfigUseCase,
} from '@application/use-cases/seed-settings';

function repository() {
  return {
    read: jest.fn().mockResolvedValue(Either.right([])),
    save: jest.fn().mockResolvedValue(Either.right(undefined)),
  } satisfies IAdminSeedConfigRepository;
}

it.each([0, 42, 0xffffffff])(
  'should_pass_the_level_and_seed_when_saving_a_fixed_sort_configuration_with_value_%s',
  async (value) => {
    // Arrange
    const repo = repository();
    const useCase = new SaveSeedConfigUseCase(repo);

    // Act
    const result = await useCase.execute({
      target: { gameId: 'hexa-sort', levelId: 'sort-01' },
      config: { mode: 'fixed', value },
    });

    // Assert
    expect(result.kind).toBe('right');
    expect(repo.save).toHaveBeenCalledWith(
      { gameId: 'hexa-sort', levelId: 'sort-01' },
      { mode: 'fixed', value },
    );
  },
);

it.each([-1, 1.5, 2 ** 32])(
  'should_reject_a_fixed_seed_outside_the_unsigned_integer_range_when_it_is %s',
  async (value) => {
    // Arrange
    const repo = repository();
    const useCase = new SaveSeedConfigUseCase(repo);

    // Act
    const result = await useCase.execute({
      target: { gameId: 'hexa-lines' },
      config: { mode: 'fixed', value },
    });

    // Assert
    expect(result).toMatchObject({
      kind: 'left',
      value: { code: 'invalid-input' },
    });
    expect(repo.save).not.toHaveBeenCalled();
  },
);

it('should_require_a_sort_level_when_saving_a_configuration', async () => {
  // Arrange
  const repo = repository();
  const useCase = new SaveSeedConfigUseCase(repo);

  // Act
  const result = await useCase.execute({
    target: { gameId: 'hexa-sort', levelId: ' ' },
    config: { mode: 'random' },
  });

  // Assert
  expect(result).toMatchObject({
    kind: 'left',
    value: { code: 'invalid-input' },
  });
  expect(repo.save).not.toHaveBeenCalled();
});

it('should_keep_a_forbidden_response_when_an_admin_save_is_denied', async () => {
  // Arrange
  const repo = repository();
  const error = new SeedSettingsError('forbidden', 'Forbidden');
  jest.spyOn(repo, 'save').mockResolvedValue(Either.left(error));
  const useCase = new SaveSeedConfigUseCase(repo);

  // Act
  const result = await useCase.execute({
    target: { gameId: 'hexa-merge' },
    config: { mode: 'random' },
  });

  // Assert
  expect(result).toMatchObject({ kind: 'left', value: { code: 'forbidden' } });
});

it('should_return_the_read_configurations_when_selecting_a_variant', async () => {
  // Arrange
  const repo = repository();
  const entries = [{ levelId: 'sort-01', config: { mode: 'random' as const } }];
  jest.spyOn(repo, 'read').mockResolvedValue(Either.right(entries));
  const useCase = new LoadSeedConfigsUseCase(repo);

  // Act
  const result = await useCase.execute({ gameId: 'hexa-sort' });

  // Assert
  expect(repo.read).toHaveBeenCalledWith('hexa-sort');
  expect(result).toMatchObject({ kind: 'right', value: entries });
});

it('should_expose_the_error_code_when_save_is_called_on_the_concrete_use_case', async () => {
  // Arrange
  const useCase = new SaveSeedConfigUseCase(repository());

  // Act
  const result = await useCase.execute({
    target: { gameId: 'hexa-sort', levelId: ' ' },
    config: { mode: 'random' },
  });

  // Assert: reading `code` with its type fails `tsc` if the class widens to `Error`.
  const code = result.fold(
    (error) => error.code,
    () => null,
  );
  expect(code).toBe('invalid-input');
});
