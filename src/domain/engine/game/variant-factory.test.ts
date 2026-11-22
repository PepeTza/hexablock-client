import type { IProgressModel } from '../../progress/progress-model';
import {
  type IGameSession,
  type IVariantFactory,
  VariantFactoryRegistry,
} from './variant-factory';

function fakeFactory(gameId: string): IVariantFactory {
  const progressModel: IProgressModel = {
    evaluate: () => ({
      progress: null,
      isNewRecord: false,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: false,
    }),
  };
  const session: IGameSession = {
    seed: null,
    state: { score: 0, moveCount: 0 },
    status: 'playing',
    outcome: null,
    subscribe: () => () => undefined,
    applyMove: () => ({ kind: 'rejected', reason: 'stub' }),
    pause: () => undefined,
    resume: () => undefined,
    resolutionDone: () => undefined,
  };
  return {
    gameId,
    usesSeed: false,
    usesLevels: false,
    createEngine: () => session,
    createProgressModel: () => progressModel,
  };
}

describe('VariantFactoryRegistry', () => {
  it('should_return_registered_factory_when_looking_up_by_game_id', () => {
    // Arrange
    const registry = new VariantFactoryRegistry();
    const factory = fakeFactory('hexa-lines');
    registry.register('hexa-lines', factory);

    // Act
    const hasIt = registry.has('hexa-lines');
    const resolved = registry.get('hexa-lines');

    // Assert
    expect(hasIt).toBe(true);
    expect(resolved).toBe(factory);
  });

  it('should_throw_when_game_id_is_duplicated_or_not_registered', () => {
    // Arrange
    const registry = new VariantFactoryRegistry();
    registry.register('hexa-fit', fakeFactory('hexa-fit'));

    // Act & Assert
    expect(() =>
      registry.register('hexa-fit', fakeFactory('hexa-fit')),
    ).toThrow(RangeError);
    expect(registry.has('hexa-quest')).toBe(false);
    expect(() => registry.get('hexa-quest')).toThrow(RangeError);
  });
});

describe('IGameSession', () => {
  type SlideMove = { readonly direction: string };
  const playSlide = (session: IGameSession<SlideMove>) =>
    session.applyMove({ direction: 'EAST' });

  it('should_not_compile_when_an_erased_session_is_used_as_a_typed_one', () => {
    // Arrange
    const erased: IGameSession = fakeFactory('hexa-lines').createEngine({
      seed: null,
    });

    // Act
    // @ts-expect-error an erased session cannot silently take another variant's moves
    const silently = () => playSlide(erased);
    const explicitly = () => playSlide(erased as IGameSession<SlideMove>);

    // Assert — compile-time check enforced by `npm run typecheck`
    expect(silently()).toEqual({ kind: 'rejected', reason: 'stub' });
    expect(explicitly()).toEqual({ kind: 'rejected', reason: 'stub' });
  });
});
