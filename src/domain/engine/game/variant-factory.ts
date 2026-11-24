import type { EventListener, GameOutcome } from '../events/domain-event';
import type { GameState } from './game-state';
import type { GameStatus, MoveResult } from './session-states';
import type { GameId } from '../../progress/player-progress';
import type { IProgressModel } from '../../progress/progress-model';

/**
 * Variant-agnostic view of a running `GameEngine` session, used by generic
 * use cases (`StartGameUseCase`, `ApplyMoveUseCase`) without coupling them to
 * a variant's `TCell` or `TCoord` types.
 *
 * `TMove` defaults to `never` and `TState` to `GameState`, so any concrete
 * `GameEngine<TCell, TCoord, TMove, TState>` can be kept as an
 * `IGameSession` (the type of its moves erased), as the factory registry
 * needs.
 *
 * `applyMove` is a function-typed property, not a method, on purpose:
 * TypeScript compares the parameters of methods loosely (bivariance) but
 * those of function properties strictly (contravariance). So an erased
 * session cannot silently become an `IGameSession<SomeMove>`, which would
 * let one variant's moves reach another variant's engine. Generic callers use
 * the erased session for lifecycle operations. Variant-specific presenters
 * receive a typed session through their concrete factory in the composition
 * root, where the move and state types are still known.
 */
export interface IGameSession<
  TMove = never,
  TState extends GameState = GameState,
> {
  readonly seed: number | null;
  readonly state: TState;
  readonly status: GameStatus;
  readonly outcome: GameOutcome | null;
  subscribe(listener: EventListener): () => void;
  /** Plays a move and says what happened (CU-02). */
  readonly applyMove: (move: TMove) => MoveResult;
  pause(): void;
  resume(): void;
  resolutionDone(): void;
}

/** Context handed by `StartGameUseCase` to a variant factory (CU-01). */
export interface VariantStartContext {
  readonly seed: number | null;
  readonly level?: unknown;
  readonly listeners?: readonly EventListener[];
}

/**
 * Abstract Factory: creates the compatible family of domain objects for one
 * variant — its configured `GameEngine` (board shape, rules, piece source,
 * scoring policy) and its `IProgressModel` (CU-01, docs/architecture.md §4).
 */
export interface IVariantFactory<
  TMove = never,
  TState extends GameState = GameState,
> {
  readonly gameId: GameId;
  /** Whether games of this variant use a seed (false for Hexa Fit). */
  readonly usesSeed: boolean;
  /** Whether games of this variant load a level definition (Fit, Sort). */
  readonly usesLevels: boolean;
  createEngine(context: VariantStartContext): IGameSession<TMove, TState>;
  createProgressModel(): IProgressModel;
}

/**
 * Registry of variant factories keyed by `GameId` (CU-01, OCP, RNF-01).
 * Adding a fifth variant means calling `register` once at app start-up,
 * without touching `StartGameUseCase`, `FinishGameUseCase` or `GameEngine`.
 */
export class VariantFactoryRegistry {
  private readonly factories = new Map<GameId, IVariantFactory>();

  register(gameId: GameId, factory: IVariantFactory): void {
    if (this.factories.has(gameId)) {
      throw new RangeError(`Variant factory already registered for ${gameId}`);
    }
    this.factories.set(gameId, factory);
  }

  has(gameId: GameId): boolean {
    return this.factories.has(gameId);
  }

  get(gameId: GameId): IVariantFactory {
    const factory = this.factories.get(gameId);
    if (factory === undefined) {
      throw new RangeError(`No variant factory registered for ${gameId}`);
    }
    return factory;
  }
}
