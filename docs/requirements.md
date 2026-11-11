# Requirements

Software requirements specification of HexaBlock Suite: purpose, scope, user
classes, the four variants, functional requirements (RF) and non-functional
requirements (RNF). Terms follow the [glossary](./glossary.md).

## 1. Purpose and scope

A mobile app (Android or iOS) with four casual puzzle games on hexagonal
boards, plus a REST backend, in two independent GitHub repositories (client
and backend). Quality target: a game that could be published on Google Play as
delivered, that applies the course content (design patterns, generics,
subtype polymorphism, Clean Architecture, aspects, DDD and testing), and that
the team can explain and defend.

**In scope:** generic engine, four variants, menu and level selection, local
persistence, sync, leaderboard, audio, two languages, automated tests, CI/CD,
diagrams and documentation.

**Out of scope (future):** 3D rendering and cell geometries other than
hexagonal (the architecture is designed to allow them, see RNF-14), real-time
multiplayer, purchases or ads, password recovery by email.

### Assumptions

- **S-01:** the client stack supports generics with constraints.
- **S-02:** an executable (APK or iOS equivalent) is delivered as a GitHub
  release.
- **S-03:** sync is deferred; the game never depends on the network to play.
- **S-04:** scoring policies and exact star rules are defined by the team (as
  the statement requires) and documented in the README.

## 2. User classes

| Role | Description | Permissions |
|---|---|---|
| Guest player | No account; plays offline | Play the four variants; local progress and records |
| Registered player | Has an account (JWT) | All of the above + sync progress, appear in leaderboards |
| Administrator | Manages content from the admin panel (D-13) | Add new Hexa Fit and Hexa Sort levels; configure the seed mode |

## 3. The four variants (normative summary)

| Dimension | Hexa Lines | Hexa Fit | Hexa Sort | Hexa Merge |
|---|---|---|---|---|
| Cell | Colour | Piece id | Colour stack | Integer |
| Board | Radius 4 (61 cells) | Arbitrary figure per level | Radius 2 (19) | Radius 2 (19) |
| Move | Place piece | Place, remove, rotate (60°) | Place stack | Slide in 6 directions |
| Resolution | Clear lines on 3 axes, combos | Validate coverage | Cascading transfer; 10 chips = goal | Merge on collision (2ⁿ) |
| Piece source | Random (3 per tray) | Fixed per level | Random | Random (2 or 4), seeded |
| End | No piece fits | Figure covered | Goals met / board full | Target tile / no moves |
| Progress | High score | Levels with stars (≥ 15) | Levels (≥ 10) | High score |
| Undo | No | Yes, unlimited + redo | No | Yes, 1 move |

## 4. Functional requirements

### Generic engine

- **RF-01:** the system provides a generic board `Board<TCell>` with a
  configurable shape and an injected geometry (neighbourhood, traversal by
  axes and rings, and rotation); hexagonal geometry with axial coordinates
  today.
- **RF-02:** the engine runs the game loop (initialise, receive move,
  validate, apply, resolve, evaluate, notify) independently of the variant and
  of the UI framework (`GameEngine<TCell, TMove, TState>`).
- **RF-03:** each variant provides its rules through
  `IGameRules<TCell, TMove, TState>`; the engine has no conditionals per
  variant.
- **RF-04:** the piece source, the scoring policy and the progress model are
  interchangeable (`IPieceSource<TPiece>`, `IScoringPolicy<TState>`,
  `IProgressModel`).
- **RF-05:** random generation is injectable and reproducible by seed.
- **RF-06:** the engine emits domain events (`LineCleared`, `StackMerged`,
  `TileMerged`, `GameOver`, `LevelCompleted`) for UI, audio and analytics.
- **RF-07:** the engine supports undo/redo through commands, enabled per
  variant.

### Variants

- **RF-08 (Hexa Lines):** place pieces by dragging, clear full lines on the
  3 axes, combos and streaks, new tray once the 3 pieces are used, game over
  when no piece fits.
- **RF-09 (Hexa Fit):** levels with a closed figure and pieces whose total
  area equals the figure's; rotation in multiples of 60°, remove and relocate
  pieces, victory when covered with no gaps or overlaps, stars by moves and
  time.
- **RF-10 (Hexa Sort):** place stacks, cascading transfer between adjacent
  stacks of the same colour, clear a stack of 10 chips, victory by goals,
  defeat when the board is full with no moves.
- **RF-11 (Hexa Merge):** slide in 6 directions, merge equal tiles into
  double, a 2 or 4 tile appears after each valid move, configurable target
  tile (e.g. 2048), defeat when no move changes the board.
- **RF-12:** scoring defined and documented per variant.
- **RF-13:** at least 15 Hexa Fit levels and 10 Hexa Sort levels,
  hand-designed, with progressive difficulty, loaded from JSON (ADR-07).

### Application

- **RF-14:** home screen with the suite name, settings and a selector for the
  four variants.
- **RF-15:** level selection (Fit and Sort) with progress, stars and locked
  levels.
- **RF-16:** victory screen (score, next level or new game) and defeat screen
  (retry). In variants with random generation, both show the game's seed.
- **RF-17:** drag and drop with a preview of whether the position is valid
  before dropping.
- **RF-18:** sound effects and music, with a mute option.
- **RF-19:** Spanish and English.
- **RF-20:** local persistence of progress, stars and scores per variant.
- **RF-21:** pause and resume a game. Desirable (see HU34): restore the game
  after the app is closed or interrupted by Android.

### Backend and sync

- **RF-22:** registration and login with JWT.
- **RF-23:** sync progress with one entry per user and per `gameId`.
- **RF-24:** global leaderboard per `gameId` and, in level-based variants,
  per level.
- **RF-25:** get level definitions and add new levels (published ones are
  never modified), with a generic schema and a section specific to each
  `gameId`; add levels without updating the app.
- **RF-26:** OpenAPI/Swagger documentation; consistent HTTP errors and
  responses.
- **RF-27:** sync fails silently without network and retries from a local
  queue.

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| RNF-01 | Extensibility | Add a fifth variant only by creating new classes or configuration, without modifying the engine (demonstrated at the defence). |
| RNF-02 | Maintainability | Follow SOLID and apply subtype polymorphism (the engine uses variants only through their abstractions), with real examples documented in the README. |
| RNF-03 | Architecture | 4-layer Clean Architecture; dependencies only point inwards. |
| RNF-04 | Cross-cutting | At least one AOP aspect (logging, exceptions, profiling, security or cache) applied through decorators/proxies on the use cases. |
| RNF-05 | Quality | Unit, integration and widget/UI tests run in CI on every pull request; contract tests between client and backend (Pact). |
| RNF-06 | Offline | Every game works 100 % without connection. |
| RNF-07 | Interface | Touch (tap and drag), portrait orientation, adapts to different screen sizes. |
| RNF-08 | Performance | Internal target: stable 60 FPS and no abnormal battery use in long sessions (team assumption). |
| RNF-09 | Size | Internal target: lightweight install (reference 50 MB, team assumption). |
| RNF-10 | Security | Hashed passwords, JWT with 90-day expiry and automatic renewal when the app opens, input validation, no secrets in the repository (OWASP guidance). |
| RNF-11 | Process | Conventional Commits in English, protected branches, pull requests, clean history. |
| RNF-12 | Documentation | All deliverable documentation in English: README in both repos (including the AI Usage Documentation section), `AI_USAGE.md`, `docs/EXTENSIBILITY.md` and diagrams with an editable source in Lucidchart linked from the README (client: class, layer and extensibility; backend: class and layer). Credits and licences of third-party assets in the README. |
| RNF-13 | Determinism | The domain can be tested without UI or database, with a fixed seed. |
| RNF-14 | Evolution (desirable) | Board logic is separated from its graphical representation and the geometry is accessed through an abstraction, so that changing the cell shape or the view (e.g. to 3D) only affects the presentation and the geometry implementation, not the rules. Not implemented in this delivery. |
| RNF-15 | Design | Domain-driven design (DDD): ubiquitous language, bounded contexts, aggregates, entities and value objects, domain events and one repository per aggregate (see [`domain-model.md`](./domain-model.md)). |
| RNF-16 | Product | Product quality: the game must be at the level of one publishable in an app store: stable, polished, with careful visual and sound feedback and no known blocking bugs (team goal). |
