# Architecture

Technology, layers, generic engine, patterns, SOLID, AOP, persistence and the
architectural decisions of HexaBlock Suite. This document lives only in the
client repository; the backend links to it instead of keeping a copy.

The domain entities and value objects are described in [`domain-model.md`](./domain-model.md).

## 1. Technology

Hard criterion of the statement: the language must support generics with
constraints.

| Part | Choice |
|---|---|
| Client | React Native + TypeScript with Expo (managed workflow; `expo prebuild` for the APK); rendering and drag with Skia and Reanimated; navigation with React Navigation |
| Admin panel | React + TypeScript with Vite; SVG hex grid; imports `src/domain` through the `@domain` alias |
| Backend | Node.js + TypeScript with NestJS; OpenAPI/Swagger; hosted on Render |
| Database | PostgreSQL managed on Supabase (used only as a database) |
| Client local storage | SQLite behind `IProgressRepository` (D-06, provisional) |
| CI/CD | GitHub Actions |

TypeScript is the course language and lets both repositories share one
language; its constrained generics (`T extends IMergeable<T>`) are checked at
compile time and erased at runtime. Flutter and Godot with C# were evaluated
(see §8). Rendering and drag performance with Skia is validated by the
Skia spike of iteration I0 (#11).

In the backend, Supabase is only the database: the REST API, JWT
authentication, roles and aspects belong to NestJS, because the statement
requires our own API. Supabase access sits behind repository ports
(Adapter). Tests use an in-memory database or a disposable PostgreSQL
container, never Supabase; Supabase keys live in environment variables,
outside the repository (RNF-10).

## 2. Clean Architecture

Four concentric layers; **dependencies only point inwards**.

| Layer | Content | Rule |
|---|---|---|
| 1. Entities / Domain | `ICoord`, `HexCoord`, `Board<TCell, TCoord>`, `Piece`, `GameEngine<...>`, `IGameRules`, `IPieceSource<TPiece>`, `IScoringPolicy<TResolution>`, `IProgressModel`, the rules of each variant, domain events | No external dependencies. The whole engine lives here. |
| 2. Use cases | One generic class per use case of [`use-cases.md`](./use-cases.md) (CU-01 to CU-18, e.g. `StartGameUseCase<...>`, `ApplyMoveUseCase<...>`, `FinishGameUseCase`), the aspects that wrap them, and the ports listed below | Depend only on their own interfaces. No use cases duplicated per game. |
| 3. Interface adapters | Presenters / view models / controllers, `IBoardProjection` (`TCoord` ↔ screen), repositories implementing the ports, entity ↔ DTO mappers, per-variant state serialisation | Translate between domain and frameworks. |
| 4. Frameworks & drivers | UI / rendering, local database, HTTP client, audio, remote database (PostgreSQL on Supabase) and the REST backend as an external service | Replaceable without touching inner layers. |

### Ports

The interfaces the use cases depend on (DIP). Every port named in a use case
or in the domain model is listed here; a new port is added here first.

| Port | Repo | Named in | Used by |
|---|---|---|---|
| `IProgressRepository` | client (local and remote implementations), backend | §2, `domain-model.md` | CU-07, CU-08, CU-12 |
| `ILevelRepository` | client, backend | §2, `domain-model.md` | CU-01, CU-08, CU-15, CU-17 |
| `ISeedConfigRepository` | client, backend | `domain-model.md` | CU-01, CU-15, CU-18 |
| `ILeaderboardRepository` | client (cache), backend | `domain-model.md` | CU-13, CU-14 |
| `IAuthService` | client | §2 | CU-10, CU-11 |
| `ISessionProvider` | client | CU-07 | CU-07 and the security aspect (RN-35) |
| `ISyncQueue` | client | CU-07 | CU-07, CU-12, CU-13 |
| `IEventBus` | client | CU-07 | CU-02, CU-06, CU-07, CU-09 (Observer) |
| `ILogger` | client, backend | `implementation-plan.md` §4 | Logging aspect (RNF-04) |
| `ISeedGenerator` | client | CU-01, RN-05 | `StartGameUseCase` (injectable random seeds) |
| `IUserRepository` | backend | `domain-model.md` | CU-10, CU-11 |
| `IPasswordHasher`, `ITokenService`, `IClock` | client (`IClock`), backend | `implementation-plan.md` §4 | CU-10, CU-11, CU-13, logging duration (RNF-04) |

## 3. Generic engine

- **`Board<TCell, TCoord extends ICoord>`**: instantiated with `Color`,
  `PieceId`, `ColorStack` or `Tile`. On hexagons the variants write
  **`HexBoard<TCell>`**, the statement's name, an alias for
  `Board<TCell, HexCoord>`.
- **No default coordinate type (DIP):** the generic engine (`engine/geometry/`,
  `engine/board/` and the rest of `engine/`) never imports a concrete
  geometry. The hexagonal one (`HexCoord`, `HexGeometry`, `HexBoard`) lives in
  `engine/hex/` and depends on the generic engine, never the reverse. A lint
  rule enforces it (test files are exempt, as they use the hexagonal geometry
  as an example).
- **`IBoardGeometry<TCoord extends ICoord>`**: geometry injected into
  the board by composition (Strategy): `origin`, neighbourhood and axes.
  Planar geometries also implement **`IPlanarRotation<TCoord>`**
  (`rotationSteps`, `rotate(coord, steps, centre?)`), used by pieces and
  variants that rotate (ISP).
  Today `HexGeometry` with `HexCoord`; changing to another 2D cell shape (e.g.
  squares) or a 3D grid (e.g. `CubeCoord` + `CubeGeometry`) means adding a new
  `ICoord` and `IBoardGeometry<TCoord>` implementation (plus an `IBoardProjection`
  adapter in layer 3) without touching `Board` or the rules (RNF-14). A 3D
  grid does not implement `IPlanarRotation`; if it needs rotation, it gets its
  own interface with the axis as a parameter.
- **Pieces (`engine/pieces/`)**: `PieceShape<TCoord>` is one shape of the
  catalog, with cells relative to its centre (the origin); `Piece<TCoord>` is
  a shape in a rotation, immutable, and gives the board cells it would cover
  with `cellsAt(anchor)` (turn with `IPlanarRotation`, then move with
  `IBoardGeometry.translate`). `PieceCatalog<TCoord>` loads the shapes from
  data and rejects repeated ids, oversized shapes and shapes that are another
  one turned. The hexagonal data and its loader live in `engine/hex/` (D-07).
  Whether a piece fits on the board (RN-02) is decided by the variant rules.
- **`IGameRules<TCell, TCoord, TMove, TState>`**: `play(board, state, move)` returns a
  `MoveOutcome`: rejected with a reason, or applied with the new state, its
  points, the variant's events and the outcome if the game ended. Variants
  extend **`BaseGameRules<TCell, TCoord, TMove, TState, TResolution>`**, whose
  `play` is the Template Method: `validate` → `apply` → `resolve` → score →
  `evaluateEnd` (`engine/game/`).
- **`GameEngine<TCell, TCoord, TMove, TState>`** (`engine/game/`): the game session. It plays
  each move on a copy of the board (`Board.clone`, Prototype) and keeps the
  copy only when the move is applied, so a rejected move or an error changes
  nothing. Its session state (`PlayingState`, `ResolvingState`, `PausedState`,
  `FinishedState`, D-22) decides what each action does. `applyMove` returns a
  `MoveResult` (rejected with its reason, or applied with its points and the
  pending outcome), so the UI never guesses what happened (CU-02). Listeners
  receive the events (Observer) only once an action is complete: events are
  queued while the session state works and delivered after it, so after a
  move the session is already `resolving` (RN-06), and a listener that throws
  does not stop the others (`onListenerError`, #113). `preview(move)` answers
  CU-03 without changing the game. It does not know the variant.
- **`IScoringPolicy<TResolution>`** (`engine/scoring/`): `pointsFor(resolution)`,
  where the resolution is what happened in the move as the rules describe it
  (for example cells placed, lines cleared and streak in Hexa Lines). It is
  injected into the rules, so the engine never sees the resolution type.
- **`IRandomSource` and `SeededRandom`** (`engine/random/`): injectable,
  seedable randomness (Strategy, RF-05, RN-05) implemented with `mulberry32`.
  Exposes `next`, `nextInt`, `pick`, `pickWeighted` and `clone` (Prototype),
  so undo (RN-31) and move previews (CU-03) can restore or fork the generator
  without leaking its internal state.
- **`IPieceSource<TPiece>`** (`engine/pieces/`): interchangeable source of
  pieces, stacks or tiles (Strategy, RF-04) with `next`, `draw`, `hasNext`
  and `clone` (Prototype). Ships with `FixedPieceSource<TPiece>` (finite,
  ordered lists such as Hexa Fit levels) and `RandomPieceSource<TPiece>`
  (uniform or weighted draws backed by `IRandomSource`); variants with custom
  generation (Hexa Lines rotated spawns, Hexa Sort stacks) implement the same
  interface.
- **`Snapshot<T extends IPrototype<T>>` and `SourcedGameRules`**
  (`engine/state/`, `engine/game/`, #111): keep sources inside the atomicity
  of a move. A variant that draws pieces or randomness during a move keeps
  its source in the state as a `Snapshot` (Memento), which can only fork new
  copies, so a saved state never advances. `SourcedGameRules` fills the
  `resolve` step: it forks the snapshot, hands the working copy to the
  variant's `resolveWith` and always stores the advanced snapshot. Previews
  (CU-03), rejected moves, errors and going back to an older state (undo,
  RN-16, RN-31) therefore never change the pieces a seed deals (RN-05).
  `IPrototype<T>` names the `clone()` contract that `IPieceSource` and
  `IRandomSource` follow. Hexa Fit draws nothing during a move and extends
  `BaseGameRules` directly.
- **`CommandHistory`, `ApplyMoveCommand`, `ICommand` and `IUndoable`**
  (`engine/commands/`, #58): Command pattern for generic undo and redo across
  any variant (RF-07). `ApplyMoveCommand` keeps isolated clones of the board
  before and after the move together with the immutable `TState` (and any
  `Snapshot<TSource>` inside it). `CommandHistory` separates stack memory
  (`maxDepth`) from the undo allowance (`allowancePerMove` and `grantUndo`),
  so baseline limits (0 in Lines/Sort, 1 without redo in Merge, unlimited with
  redo in Fit) are configuration and an in-game booster Decorator can unlock
  extra undos mid-game without touching the engine or the variants.
- **`IVariantFactory` and `VariantFactoryRegistry`** (`engine/game/`): Abstract
  Factory contract producing a variant's `IGameSession` (`GameEngine`) and
  `IProgressModel`, registered by open `GameId` (`string`) so adding a fifth
  variant touches neither the engine nor the use cases (OCP, RNF-01). The
  registry erases the move type (`IGameSession`); `applyMove` is a
  function-typed property, which TypeScript checks contravariantly, so the
  type can only be recovered with one explicit cast in the variant's
  presentation factory, never in generic code.
- **`IProgressModel` and `PlayerProgress`** (`domain/progress/`): Strategy
  evaluating finished games (high score, level stars, unlocks) plus
  `mergeProgress` keeping the best of each (RN-36).
- **Type constraints** (to be justified in the README): e.g.
  `TCell extends IMergeable<TCell>` for Merge; `TState extends IUndoable` for
  variants with baseline undo (RF-07).
- **ISP:** `IUndoable`, `ITimed`, `IRandomSeeded` as separate interfaces;
  Hexa Lines does not implement `IUndoable`.
- **Common state:** every variant state extends `GameState` (score and move
  count), an immutable plain object, and the engine requires it with the
  constraint `TState extends GameState`. The status is the engine's session
  state (D-22) and the seed belongs to the engine, since both concern the
  whole game; the duration arrives with the clock (T35). Move count and
  duration let the server validate scores (RN-39). Rules and scoring
  policies keep no memory between moves: the tray, a streak or the position
  of a source go in the state (a source as a `Snapshot`).

## 4. Design patterns

| Pattern | Where it applies |
|---|---|
| Strategy (required) | Interchangeable resolution rules, scoring, piece source, progress model and level validator; board geometry |
| Abstract Factory (required) | `HexaLinesFactory`, `HexaFitFactory`, `HexaSortFactory`, `HexaMergeFactory` create rules, source, scoring and board shape |
| Builder | Building Fit and Sort levels from JSON (ADR-07) |
| Prototype | Cloning pieces, boards and states for rotation, preview and undo; forking piece and random sources (`IPrototype<T>`) |
| Memento | `Snapshot<T>`: a frozen point of a piece or random source kept in the game state, which can only fork copies (#111) |
| Singleton / single-scope DI | `AudioManager`, `SessionManager` |
| Decorator | The basis of AOP on use cases (logging, security, retries, cache). Rules decorators (time limit, boosters) are a planned extension point (see [`EXTENSIBILITY.md`](./EXTENSIBILITY.md)) |
| Adapter / Facade | Wrapping database, network and audio; `GameServiceFacade` |
| Observer | Domain events to UI, audio and analytics |
| Command | Each move as a command for undo/redo |
| State | `PlayingState`, `ResolvingState`, `PausedState`, `FinishedState`: the session states inside `GameEngine`, each deciding which actions it allows (D-22). The menu is navigation, not a game state |
| Template Method | Turn skeleton: validate, apply, resolve, evaluate |
| Iterator | Traversal by axes, rings and neighbourhood |

A pattern is kept only if the team can justify it; any pattern dropped during
implementation is removed from this table in the same PR.

## 5. SOLID

- **SRP:** `HexGeometry`, `HexaLinesRules`, `BoardRenderer`,
  `ProgressRepository` are separate.
- **OCP:** a new variant = new classes + `IGameRules`; the engine does not
  change.
- **LSP:** `HexaSortRules` and `HexaMergeRules` are interchangeable wherever
  `IGameRules` is expected.
- **ISP:** small interfaces (`IUndoable`, `ITimed`, `IRandomSeeded`).
- **DIP:** use cases depend on `IProgressRepository` and `IPieceSource`.

## 6. AOP without libraries

Decorators / proxies on the generic use cases, so one aspect applies to the
four variants.

- **Minimum:** logging and traceability (`LoggingUseCaseDecorator`: name and
  duration of every use case except CU-03).
  - Input and output are logged only through an allowlist
    (`describe: { input?, output? }`) supplied in the composition root when
    each use case is wrapped. Without it, only the name, duration and error
    message are logged.
  - A denylist of key names was rejected (it only protects the names someone
    remembered).
  - Error messages must never contain user data (passwords, tokens,
    usernames), because the message is always logged (decision 22).
- **Low-cost extras:** centralised exception handling with retries on sync;
  security (session check before CU-12, CU-13, CU-14); short-lived cache on
  the leaderboard (CU-14); profiling of the Hexa Sort cascade.
- **Backend:** NestJS interceptors, guards and exception filters.

## 7. Persistence and sync

- Local save after each relevant move and when going to the background
  (Android lifecycle).
- Queue of pending operations; sent when there is a network; silent failure
  offline.
- Conflict resolution: the best score and the maximum stars per level win
  (RN-36).

## 8. Stack evaluation (summary)

Criteria: constrained generics; domain separated from UI; unit and UI tests;
runs on GitHub Actions; lightweight Android build; smooth touch input; VS Code
comfort; affinity with the course language (TypeScript).

| Client option | Main reason it was not chosen |
|---|---|
| Flutter (Dart) | Strong candidate; not the course language |
| Godot 4 with C# | C# export to Android is experimental in Godot 4.3 |
| Unity (C#) | Heavy editor, delicate version control (`.meta`, scenes) |
| Kotlin + Jetpack Compose | Android only; Android Studio rather than VS Code |
| **React Native + TypeScript (chosen)** | Risk: game rendering needs Skia + Reanimated and performance tuning |

| Backend option | Main reason it was not chosen |
|---|---|
| **NestJS (chosen)** | Built-in OpenAPI, DI, and interceptors that fit the required aspects |
| Express / Fastify | Manual architecture and DI |
| ASP.NET Core | Heavier tooling; different language from the client |
| FastAPI (Python) | Weaker typing and generics; an extra language |
| Firebase | Does not provide our own REST API with JWT and Swagger |

## 9. Architecture decision records (ADR)

| ID | Decision |
|---|---|
| ADR-01 | Client and backend technology (accepted 2026-11-04): React Native + TypeScript; NestJS + PostgreSQL on Supabase |
| ADR-02 | Thick client with all game logic on the device; zero touch latency |
| ADR-03 | Pure domain with no framework imports |
| ADR-04 | Deferred sync with a local queue |
| ADR-05 | Generic engine with type constraints instead of inheritance per variant |
| ADR-06 | Aspects through decorators on use cases |
| ADR-07 | Levels as data (JSON) served by the API, with a bundled copy for offline use |

## 10. Decisions (D-xx)

### Decided

| ID | Decision |
|---|---|
| D-01 | Client stack: React Native + TypeScript (ADR-01) |
| D-02 | Backend stack and database: NestJS + PostgreSQL on Supabase (ADR-01) |
| D-03 | AI tooling: Claude as the common tool; `AI-Assisted` commit footer; `AGENTS.md` and the harness |
| D-05 | Test coverage: 80 % in domain and use cases; Pact contract tests between client and backend |
| D-06 | Client local storage (provisional, 2026-11-11): SQLite behind `IProgressRepository`. A key-value JSON store was the alternative; the question is open with the professor, and changing it only touches the storage adapter |
| D-07 | Piece catalog (2026-11-11): the 15 poly-hex shapes of 1 to 4 cells plus about 6 shapes of 5 cells, kept as data. Hexa Lines gives each shape a spawn weight and may spawn a piece already rotated; the player still cannot rotate it (RN-11). Format (T12, 2026-11-20): `src/domain/engine/hex/hex-pieces.json`, one entry per shape with a stable `id` (`p<cells>-<nn>`) and its axial cells relative to the piece's centre `[0, 0]`, the cell it turns around (the cell closest to all the others). The 5-cell selection is `p5-01`, `p5-07`, `p5-16`, `p5-22`, `p5-26` and `p5-33`; [`piece-catalog.md`](./piece-catalog.md) draws every shape and the 27 alternatives. Spawn weights are not in the catalog: they belong to Hexa Lines |
| D-10 | Backend deployed online on Render (free plan), with the database on Supabase (free plan). Known limits: the service sleeps after 15 minutes idle (first request takes 30–60 s) and Supabase pauses a project after 7 days without use |
| D-11 | All documentation in English |
| D-12 | Basic server-side score validation (RN-39); the leaderboard shows the top 50 and the player's position |
| D-13 | Level creation is protected: admin role in the JWT and an admin web panel with a level editor on the hex grid; current scope: create levels and configure seeds |
| D-16 | No domain package is shared between repositories. The domain lives only in the client repo, and so does the admin panel (`admin/`), a web app that imports the level validators directly and calls the API. The backend checks the format of levels, not their solvability; the game re-validates every downloaded level (CU-15 A2). Server-side replay of games is dropped |
| D-14 | Hexa Fit keeps a per-level leaderboard, ranked by level score (RN-18); the global one ranks by the sum of scores (RN-34) |
| D-15 | The admin configures the seed mode (fixed or random) of Hexa Lines, Hexa Merge and each Hexa Sort level; the seed is shown at the end (RN-05) |
| D-17 | Client on Expo, managed workflow (2026-11-11): Skia, Reanimated and Gesture Handler are supported, the app runs on phones through Expo Go from day one, and the APK is built in GitHub Actions with `expo prebuild` and Gradle, with no external build account |
| D-18 | Admin panel with Vite + React + TypeScript (2026-11-11): the same React as the app; no server rendering is needed, so Next.js was not chosen; React Native Web was not chosen because Skia on the web is complex. The level editor draws the hex grid with SVG |
| D-19 | The admin panel imports the domain and the application layer through the `@domain` and `@application` path aliases (2026-11-11, extended to `src/application` on 2026-11-18), with no shared package (D-16). The panel is a separate layer-4 web app, not part of the APK: it reuses the generic use cases (CU-11, CU-17, CU-18) and brings its own adapters for their ports (HTTP, browser storage for drafts). Lint forbids it from importing `adapters`, `frameworks` or the mobile UI packages. So the panel always builds in a browser, `src/application`, like `src/domain`, imports no external package: anything platform-specific (ids, clock, storage) goes through a port |
| D-20 | Navigation with React Navigation (2026-11-11): screens are declared in code inside `src/frameworks/ui`; Expo Router was not chosen because it derives routes from an `app/` folder outside the layers |
| D-21 | Pointy-top hexagons with axial coordinates (2026-11-11): the six directions are east, south-east, south-west, west, north-west and north-east (`HexDirection`), and rows run west to east. The renderer and the Hexa Merge swipe use the same orientation. Directions and axes are declared by each geometry, so another cell shape is a new `IBoardGeometry` in its own file |
| D-22 | State pattern limited to the game session (2026-11-18): `GameEngine` delegates `applyMove`, `undo`, `redo`, `pause`, `resume` and `resolutionDone` to one of four states, `PlayingState`, `ResolvingState` (the RN-06 lock, released by the UI with `resolutionDone` when its animation ends), `PausedState` and `FinishedState` (with `outcome` victory or defeat), and exposes the current one as a `GameStatus` value. Of the six states of the statement, `MenuState` was dropped because the menu is navigation (D-20), and `GameOverState` and `VictoryState` became one state because they allow the same actions. The rules check for the end of the game when the move is applied, so pausing during an animation goes to `PausedState` and `resume` goes straight to `PlayingState` or `FinishedState`. Undo is rejected once the game is finished. Reaching the Hexa Merge target emits `TargetReached` and the game stays in `PlayingState` (HU28). Transition table in `use-cases.md` CU-06 |
| — | Backend ORM: Prisma, behind the repository ports (see the backend `docs/data-model.md`) |
| — | Licence: MIT |
| — | Merge strategy: rebase and merge (see `CONTRIBUTING.md`) |

### D-08 — Hexa Lines scoring

Each accepted placement earns `cellPoints * C + linePoints * L² * (1 + 0.5 * (S - 1))`
([#31 scoring proposal](https://github.com/PepeTza/hexablock-client/issues/31#issuecomment-6998461493)).
`C` is the size of the placed piece, `L` is the number of complete lines
cleared together, and `S` is the current streak, including this move.
The streak starts at zero, increases once per clearing move and resets to
zero on an accepted move without a clear. Rejected moves leave it unchanged.
The defaults are 1 point per cell and 10 per line. An even line value keeps
the line bonus integral. A shared cell is removed once, and each complete
line still contributes to the combo.

The scoring multiplier uses the full streak. A cap of five would simplify
the server's plausibility check (RN-39) but would lower the score from the
sixth consecutive clearing move onward. With the RN-03 catalog, a piece
has at most five cells and can complete at most 15 lines: each new complete
line crosses one of the placed cells, each of which lies on three axes.
On move `m`, the streak is at most `m`, so default scoring gives a
conservative per-move bound of `5 + 1125 * (m + 1)`. This bound
assumes the board has no complete lines before placement and does not set
the server's validation policy.

### Pending design items

| ID | Item | Scope |
|---|---|---|
| D-08 | Scoring and stars | Hexa Fit score from moves and time, final values of RN-29 and RN-40, star thresholds per level (RN-18) |
| D-09 | Level design tools | Candidate generator as a design aid (manual selection and adjustment) and validator with solution search (RN-13) |

## 11. Testing strategy

- **Unit** (AAA, `should_<result>_when_<condition>`): rules of the 4 variants
  (lines on 3 axes, exact coverage, cascade, merge), geometry and engine with a
  test cell; repository mocks and a fixed seed.
- **Integration:** use cases with an in-memory database; REST endpoints with
  an HTTP client, including the `gameId` filter; save-and-load flow per
  variant.
- **UI:** rendering and navigation home → game selection → level selection
  (Fit and Sort) → game → victory/defeat.
- **Contract:** Pact between client and backend (D-05).
- **CI:** GitHub Actions runs everything on every pull request; protected
  branches; commitlint.
