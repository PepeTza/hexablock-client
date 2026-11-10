# Architecture

Technology, layers, generic engine, patterns, SOLID, AOP, persistence and the
architectural decisions of HexaBlock Suite. This document is shared by both
repositories; the copy in the client repo is the reference.

The DDD model is in [`domain-model.md`](./domain-model.md).

## 1. Technology

Hard criterion of the statement: the language must support generics with
constraints.

| Part | Choice |
|---|---|
| Client | React Native + TypeScript; rendering and drag with Skia and Reanimated |
| Backend | Node.js + TypeScript with NestJS; OpenAPI/Swagger |
| Database | PostgreSQL managed on Supabase (used only as a database) |
| Client local storage | SQLite or a configuration file behind `IProgressRepository` (D-06) |
| CI/CD | GitHub Actions |

TypeScript is the course language and lets both repositories share one
language; its constrained generics (`T extends IMergeable<T>`) are checked at
compile time and erased at runtime. Flutter and Godot with C# were evaluated
(see §8). Rendering and drag performance with Skia is validated with the
`Board<TCell>` prototype in iteration 2.

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
| 1. Entities / Domain | `Coord`, `Board<TCell>`, `Piece`, `GameEngine<...>`, `IGameRules`, `IPieceSource<TPiece>`, `IScoringPolicy<TState>`, `IProgressModel`, the rules of each variant, domain events | No external dependencies. The whole engine lives here. |
| 2. Use cases | `StartGameUseCase<...>`, `ApplyMoveUseCase<...>`, `UndoMoveUseCase`, `FinishGameUseCase`, `SyncProgressUseCase`, `GetLeaderboardUseCase`, `LoadLevelsUseCase`, ports (`IProgressRepository`, `ILevelRepository`, `IAuthService`) | Depend only on their own interfaces. No use cases duplicated per game. |
| 3. Interface adapters | Presenters / view models / controllers, repositories implementing the ports, entity ↔ DTO mappers, per-variant state serialisation | Translate between domain and frameworks. |
| 4. Frameworks & drivers | UI / rendering, local database, HTTP client, audio, remote database (PostgreSQL on Supabase) and the REST backend as an external service | Replaceable without touching inner layers. |

## 3. Generic engine

- **`Board<TCell>`**: instantiated with `Color`, `PieceId`, `ColorStack` or
  `Tile`. It is the statement's `HexBoard<TCell>`, generalised.
- **`IBoardGeometry`**: geometry injected into the board by composition
  (Strategy): neighbourhood, axes and rotation. Today `HexGeometry`; changing
  the cell shape (e.g. squares) means adding another implementation without
  touching the board (RNF-14).
- **`IGameRules<TCell, TMove, TState>`**: `legalMoves`, `apply`, `resolve`,
  `evaluateEnd`.
- **`GameEngine<TCell, TMove, TState>`**: orchestrates the turn; emits events;
  does not know the variant.
- **`IPieceSource<TPiece>`, `IScoringPolicy<TState>`, `IProgressModel`**:
  interchangeable piece source, scoring and progress.
- **Type constraints** (to be justified in the README): e.g.
  `TCell extends IMergeable<TCell>` for Merge; `TMove extends ICommandable` to
  support undo.
- **ISP:** `IUndoable`, `ITimed`, `IRandomSeeded` as separate interfaces;
  Hexa Lines does not implement `IUndoable`.
- **Common state:** every variant state extends `GameState` (score, game
  status, seed, move count and duration), and the engine requires it with the
  constraint `TState extends GameState`. Move count and duration let the
  server validate scores (RN-39).

## 4. Design patterns

| Pattern | Where it applies |
|---|---|
| Strategy (required) | Interchangeable resolution rules, scoring and piece source; board geometry |
| Abstract Factory (required) | `HexaLinesFactory`, `HexaFitFactory`, `HexaSortFactory`, `HexaMergeFactory` create rules, source, scoring and board shape |
| Builder | Building Fit and Sort levels from JSON/YAML |
| Prototype | Cloning pieces and states for rotation, preview and undo |
| Singleton / single-scope DI | `AudioManager`, `SessionManager` |
| Composite | Pieces as a composition of cells; figures as a composition of regions |
| Decorator | `TimedRulesDecorator`, `BonusMultiplierDecorator`, and the basis of AOP on use cases |
| Adapter / Facade | Wrapping database, network and audio; `GameServiceFacade` |
| Observer | Domain events to UI, audio and analytics |
| Command | Each move as a command for undo/redo |
| State | `MenuState`, `PlayingState`, `ResolvingState`, `PausedState`, `GameOverState`, `VictoryState` |
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

- **Minimum:** logging and traceability (`LoggingUseCaseDecorator`: input,
  output and duration of `ApplyMoveUseCase.execute()`), on every use case
  except CU-03.
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
| D-10 | Backend deployed online, with the database on Supabase |
| D-11 | All documentation in English |
| D-12 | Basic server-side score validation (RN-39), with replay as an optional improvement; the leaderboard shows the top 50 and the player's position |
| D-13 | Level creation is protected: admin role in the JWT and an admin web panel served by the backend, with a level editor on the hex grid; current scope: create levels and configure seeds |
| D-14 | Hexa Fit keeps a per-level leaderboard, ranked by level score (RN-18); the global one ranks by the sum of scores (RN-34) |
| D-15 | The admin configures the seed mode (fixed or random) of Hexa Lines, Hexa Merge and each Hexa Sort level; the seed is shown at the end (RN-05) |
| — | Licence: MIT |
| — | Merge strategy: rebase and merge (see `CONTRIBUTING.md`) |

### Pending design items

| ID | Item | Scope |
|---|---|---|
| D-06 | Client local storage | SQLite or a configuration file, behind `IProgressRepository` |
| D-07 | Piece catalog | Poly-hex shapes of 1 to 5 cells and their frequency in the tray |
| D-08 | Scoring and stars | RN-10 formula, Hexa Fit score from moves and time, final values of RN-29 and RN-40, star thresholds per level (RN-18) |
| D-09 | Level design tools | Candidate generator as a design aid (manual selection and adjustment) and validator with solution search (RN-13) |
| D-16 | Domain shared between repositories | The panel's level validator (RN-13) and replay validation (RN-39) need the engine in the backend: private npm package or git submodule |

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
