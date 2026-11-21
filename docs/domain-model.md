# Domain Model (Clean Architecture — Layer 1)

Names follow the [glossary](./glossary.md); rules (RN-xx) are in
[`business-rules.md`](./business-rules.md).

## Quick reference

| Term | Meaning in Clean Architecture |
|---|---|
| Entity | A Layer 1 domain object with identity (`sessionId`, `userId`, `levelId`) and business rules |
| Value object | An immutable object defined only by its values (`HexCoord`, `Seed`, `Tile`) |
| Invariant | A business rule that must always hold inside a domain entity |
| Event (Observer) | A notification emitted by the game engine so UI, audio and persistence can react without coupling |
| Repository port | An interface in Layer 2 (`src/application/ports/`) that loads and saves domain entities |

## Domain areas

| Area | Content | Where |
|---|---|---|
| **Game** | Engine and variants | Client (`src/domain/engine`, `src/domain/variants`) |
| **Progress & leaderboard** | Account, progress and ranking | Client (`src/domain/progress`) and server |
| **Content** | Levels and seed configuration | Server, with a bundled copy on the client (`src/domain/content`) |

Game reads content when a game starts (CU-01) and hands its result to
Progress through `FinishGameUseCase` (CU-07); the engine never knows about
accounts or leaderboards. Client and server communicate only through the API,
verified with contract tests.

## Game

**Core entity: game session (`GameEngine<TCell, TCoord, TMove, TState>`).**
Identified by `sessionId`. It holds the board (`Board<TCell, TCoord>`), the
state (`TState extends GameState`, a value object) and the command history. The
strategies (rules, piece source, scoring and progress) are injected by the
variant factory.

**Value objects:** `HexCoord` (implementing `ICoord`), `Direction`, `Axis`,
`BoardShape`, `PieceShape`, `Piece` (shape, rotation and, in Fit, `PieceId`),
`Tray`, `Color`, `Chip`, `ColorStack`, `Tile`, the moves (`PlacePieceMove`,
`FitMove`, `PlaceStackMove`, `SlideMove`), `Seed` and `GameStatus`.

**General invariants**

- The board only changes through a validated move.
- Each move is fully resolved before the next one (RN-06).
- On an error, the game stays as it was.
- Same seed and same moves give the same result (RN-05).

**Invariants per variant**

| Variant | Invariant |
|---|---|
| Lines | No complete lines after resolving; at most 3 pieces in the tray (RN-08, RN-09) |
| Fit | No overlaps; pieces inside the figure; every piece either placed or pending (RN-02) |
| Sort | No possible transfers and no runs of 10+ same-colour chips after resolving (RN-21, RN-23) |
| Merge | Tiles are powers of 2; no double merges; a new tile only after a valid move (RN-27, RN-28) |

**Observer events:** `GameStarted`, `MoveApplied`, `MoveRejected`, `LineCleared`,
`StackMerged`, `GoalCompleted`, `TileMerged`, `TileSpawned`, `TargetReached`,
`MoveUndone`, `MoveRedone`, `GamePaused`, `GameResumed`, `GameOver`,
`LevelCompleted`.

**Factories:** one per variant, plus the factory registry (CU-01).

Finding possible moves is part of each variant's rules, and a game in progress
is not saved (unless HU34 is done).

## Progress & leaderboard

**Entity: `PlayerProgress`.** One per player (or the device's guest) and per
variant (RN-33). Contains the record and, per level, completed, stars and best
score. Invariant: it only improves; merging two progresses keeps the best of
each (RN-36), and that logic lives inside `PlayerProgress`.

**Entity: `User`.** Identity `userId`; unique name, password hash and role.
Invariants: unique name and password never in plain text.

**Entity: `LeaderboardEntry`.** One per player and table (variant, and level in
Fit and Sort), with the best score and its date. Invariant: it only improves;
on equal score the earliest date wins (RN-43).

**Value objects:** `Username`, `PasswordHash`, `Role`, `ScoreSubmission`
(variant, level, score, seed, moves, duration and `sessionId`), `StarCount`.

**Backend validation:** score plausibility check (RN-39).

**Repository ports (Layer 2):** `IProgressRepository` (local and remote
implementations), `IUserRepository`, `ILeaderboardRepository`.

## Content

**Entity: `LevelDefinition`.** Identity `levelId`; a common part and a part
specific to the variant. Invariants: immutable once published and always at the
end of the order (RN-37); in Fit, the pieces' area equals the figure's and
there is a solution (RN-13).

**Entity: `SeedConfig`.** One per variant, and per level in Sort. Invariant: if
the mode is fixed, it has a value.

**Value objects:** `Figure`, `StarThresholds`, the parameters of a Sort level,
`SeedMode`.

**Validators & builder:** level validators behind `ILevelValidator` (Fit
searches for a solution), the candidate generator (D-09), and the level
`LevelBuilder`.

**Repository ports (Layer 2):** `ILevelRepository`, `ISeedConfigRepository`.
