import type { DomainEvent } from '../../engine/events/domain-event';
import { HexDirection } from '../../engine/hex/hex-geometry';
import { emptyProgress } from '../../progress/player-progress';
import { MergeVariantFactory } from './merge-variant-factory';

describe('MergeVariantFactory', () => {
  it('should_create_seeded_merge_engine_and_notify_listeners_when_seed_is_provided', () => {
    // Arrange
    const factory = new MergeVariantFactory();
    const events: DomainEvent[] = [];

    // Act
    const session = factory.createEngine({
      seed: 42,
      listeners: [(event) => events.push(event)],
    });
    const result = session.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(factory.gameId).toBe('hexa-merge');
    expect(factory.usesSeed).toBe(true);
    expect(factory.usesLevels).toBe(false);
    expect(session.seed).toBe(42);
    expect(result.kind).toBe('applied');
    expect(events.some((event) => event.type === 'TileSpawned')).toBe(true);
  });

  it('should_throw_range_error_when_creating_merge_engine_without_seed', () => {
    // Arrange
    const factory = new MergeVariantFactory();

    // Act & Assert
    expect(() => factory.createEngine({ seed: null })).toThrow(RangeError);
  });

  it('should_update_high_score_only_when_new_score_exceeds_current_record', () => {
    // Arrange
    const model = new MergeVariantFactory().createProgressModel();
    const current = { ...emptyProgress('hexa-merge'), highScore: 256 };

    // Act
    const beaten = model.evaluate(current, {
      gameId: 'hexa-merge',
      levelId: null,
      reason: 'defeat',
      score: 512,
      moveCount: 30,
      durationMs: 45_000,
      seed: 7,
    });
    const tied = model.evaluate(current, {
      gameId: 'hexa-merge',
      levelId: null,
      reason: 'defeat',
      score: 256,
      moveCount: 20,
      durationMs: 30_000,
      seed: 7,
    });
    const zero = model.evaluate(emptyProgress('hexa-merge'), {
      gameId: 'hexa-merge',
      levelId: null,
      reason: 'defeat',
      score: 0,
      moveCount: 5,
      durationMs: 10_000,
      seed: 7,
    });

    // Assert
    expect(beaten).toEqual({
      progress: { ...current, highScore: 512 },
      isNewRecord: true,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: true,
    });
    expect(tied).toEqual({
      progress: null,
      isNewRecord: false,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: true,
    });
    expect(zero.shouldSubmitScore).toBe(false);
    expect(zero.isNewRecord).toBe(false);
  });
});
