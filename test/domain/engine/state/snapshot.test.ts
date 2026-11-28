import { RandomPieceSource } from '@domain/engine/pieces/random-piece-source';
import { SeededRandom } from '@domain/engine/random/seeded-random';
import { Snapshot } from '@domain/engine/state/snapshot';

const POOL = ['a', 'b', 'c', 'd', 'e'];

describe('Snapshot', () => {
  it('should_start_at_the_captured_point_when_forking', () => {
    // Arrange
    const source = RandomPieceSource.uniform(POOL, new SeededRandom(7));
    source.draw(2);
    const expected = source.clone().draw(10);
    const snapshot = Snapshot.of(source);

    // Act
    const dealt = snapshot.fork().draw(10);

    // Assert
    expect(dealt).toEqual(expected);
  });

  it('should_not_change_when_the_captured_source_advances_later', () => {
    // Arrange
    const source = RandomPieceSource.uniform(POOL, new SeededRandom(7));
    const expected = source.clone().draw(10);
    const snapshot = Snapshot.of(source);

    // Act
    source.draw(5);
    const dealt = snapshot.fork().draw(10);

    // Assert
    expect(dealt).toEqual(expected);
  });

  it('should_give_independent_copies_when_forking_twice', () => {
    // Arrange
    const snapshot = Snapshot.of(
      RandomPieceSource.uniform(POOL, new SeededRandom(7)),
    );
    const first = snapshot.fork();
    const second = snapshot.fork();

    // Act
    const fromFirst = first.draw(10);
    const fromSecond = second.draw(10);

    // Assert
    expect(fromSecond).toEqual(fromFirst);
  });

  it('should_capture_a_random_source_when_the_source_is_seeded_random', () => {
    // Arrange
    const random = new SeededRandom(99);
    random.next();
    const expected = random.clone().nextInt(0, 1000);
    const snapshot = Snapshot.of(random);

    // Act
    random.next();
    const value = snapshot.fork().nextInt(0, 1000);

    // Assert
    expect(value).toBe(expected);
  });

  it('should_not_compile_when_drawing_from_a_snapshot', () => {
    // Arrange
    const snapshot = Snapshot.of(
      RandomPieceSource.uniform(POOL, new SeededRandom(7)),
    );

    // Act
    // @ts-expect-error a snapshot cannot be advanced: it only forks copies
    const draw: unknown = snapshot.draw;
    // @ts-expect-error a snapshot cannot be advanced: it only forks copies
    const next: unknown = snapshot.next;

    // Assert — compile-time check enforced by `npm run typecheck`
    expect(draw).toBeUndefined();
    expect(next).toBeUndefined();
  });
});
