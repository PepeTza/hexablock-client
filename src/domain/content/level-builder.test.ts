import type { ILevelValidator } from './level-validator';
import { LevelBuilder } from './level-builder';

const levelData = {
  id: 'level-1',
  gameId: 'hexa-fit',
  order: 1,
  schemaVersion: 1,
  publishedAt: '2026-11-23T12:00:00Z',
  spec: { example: [{ value: 1 }] },
};

describe('LevelBuilder', () => {
  it('should_build_a_level_when_the_decoded_json_has_the_common_fields', () => {
    // Arrange
    const data: unknown = JSON.parse(JSON.stringify(levelData));

    // Act
    const level = LevelBuilder.fromData(data);

    // Assert
    expect(level).toEqual(levelData);
  });

  it('should_preserve_variant_data_when_the_game_and_version_are_new', () => {
    // Arrange
    const data = {
      ...levelData,
      gameId: 'hexa-quest',
      schemaVersion: 2,
      spec: { example: [null, true, 'text', 0] },
    };

    // Act
    const level = LevelBuilder.fromData(data);

    // Assert
    expect(level).toEqual(data);
  });

  it('should_build_an_immutable_snapshot_when_the_input_is_mutable', () => {
    // Arrange
    const entry = { value: 1 };
    const spec = { example: [entry] };
    const data = { ...levelData, spec };

    // Act
    const level = LevelBuilder.fromData(data);
    entry.value = 2;
    spec.example.push({ value: 3 });

    // Assert
    expect(level.spec).toEqual({ example: [{ value: 1 }] });
    expect(Object.isFrozen(level)).toBe(true);
    expect(Object.isFrozen(level.spec)).toBe(true);
    expect(Object.isFrozen(level.spec.example)).toBe(true);
    const example = level.spec.example;
    expect(Array.isArray(example) && Object.isFrozen(example[0])).toBe(true);
  });

  it.each([
    ['level', null],
    ['level', []],
    ['id', { ...levelData, id: ' ' }],
    ['gameId', { ...levelData, gameId: 4 }],
    ['order', { ...levelData, order: 0 }],
    ['order', { ...levelData, order: 1.5 }],
    ['schemaVersion', { ...levelData, schemaVersion: undefined }],
    ['schemaVersion', { ...levelData, schemaVersion: '1' }],
    ['publishedAt', { ...levelData, publishedAt: 'yesterday' }],
    ['publishedAt', { ...levelData, publishedAt: '2026-02-30T12:00:00Z' }],
    ['spec', { ...levelData, spec: [] }],
    ['spec', { ...levelData, spec: null }],
    [
      'spec.example[0].value',
      { ...levelData, spec: { example: [{ value: NaN }] } },
    ],
  ])('should_name_the_invalid_field_when_%s_is_malformed', (field, data) => {
    // Arrange & Act
    const build = () => LevelBuilder.fromData(data);

    // Assert
    expect(build).toThrow(field + ' must');
  });

  it('should_name_the_nested_field_when_the_spec_contains_a_cycle', () => {
    // Arrange
    const spec: Record<string, unknown> = {};
    spec.loop = spec;

    // Act
    const build = () => LevelBuilder.fromData({ ...levelData, spec });

    // Assert
    expect(build).toThrow('spec.loop');
  });

  it('should_accept_a_variant_validator_when_the_level_needs_playability_checks', () => {
    // Arrange
    const level = LevelBuilder.fromData(levelData);
    const validator: ILevelValidator = {
      validate: (candidate) =>
        candidate.spec.example === undefined
          ? { valid: true }
          : {
              valid: false,
              errors: [{ field: 'spec.example', message: 'No solution' }],
            },
    };

    // Act
    const result = validator.validate(level);

    // Assert
    expect(result).toEqual({
      valid: false,
      errors: [{ field: 'spec.example', message: 'No solution' }],
    });
  });
});
