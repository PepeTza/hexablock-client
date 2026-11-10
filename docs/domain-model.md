# Domain Model (DDD)

Names follow the [glossary](./glossary.md); rules (RN-xx) are in
[`business-rules.md`](./business-rules.md).

## Quick reference

| Term | Meaning here |
|---|---|
| Bounded context | A part of the system with its own model and vocabulary |
| Aggregate | A cluster of objects changed together as one unit, through its **root** |
| Entity | An object with identity that lasts over time (`sessionId`, `userId`) |
| Value object | An immutable object defined only by its values (`Coord`, `Seed`) |
| Invariant | A rule that must always hold inside an aggregate |
| Domain event | Something that happened in the domain that others may react to |
| Repository | Loads and saves a whole aggregate; one per aggregate |
| Domain service | Domain logic that does not belong to a single aggregate |

## Bounded contexts

| Context | Content | Where |
|---|---|---|
| **Game** | Engine and variants | Client |
| **Progress & leaderboard** | Account, progress and ranking | Client and server |
| **Content** | Levels and seed configuration | Server, with a copy on the client |

Game reads content when a game starts (CU-01) and hands its result to
Progress through `FinishGameUseCase` (CU-07), which translates from one
context to the other; the engine never knows about accounts or leaderboards.
Client and server share Progress and Content only through the API, verified
with contract tests.

## Game context

**Aggregate: game session.** Root: `GameEngine<TCell, TMove, TState>`, with
identity `sessionId`. It contains the board (`Board<TCell>`), the state
(`TState extends GameState`, a value object) and the command history. The
strategies (rules, piece source, scoring and progress) are not part of the
aggregate: the factory injects them.

**Value objects:** `Coord`, `Direction`, `Axis`, `BoardShape`, `PieceShape`,
`Piece` (shape, rotation and, in Fit, `PieceId`), `Tray`, `Color`, `Chip`,
`ColorStack`, `Tile`, the moves (`PlacePieceMove`, `FitMove`,
`PlaceStackMove`, `SlideMove`), `Seed` and `GameStatus`.

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

**Events:** `GameStarted`, `MoveApplied`, `MoveRejected`, `LineCleared`,
`StackMerged`, `GoalCompleted`, `TileMerged`, `TileSpawned`, `TargetReached`,
`MoveUndone`, `MoveRedone`, `GamePaused`, `GameResumed`, `GameOver`,
`LevelCompleted`.

**Factories:** one per variant, plus the factory registry (CU-01).

No domain services or repositories of its own: finding possible moves is part
of the rules, and a game in progress is not saved (unless HU34 is done).

## Progress & leaderboard context

**Aggregate: player progress (`PlayerProgress`).** One per player (or the
device's guest) and per variant (RN-33). Contains the record and, per level,
completed, stars and best score. Invariant: it only improves; merging two
progresses keeps the best of each (RN-36), and that logic lives inside the
aggregate.

**Aggregate: user (`User`).** Identity `userId`; unique name, password hash and
role. Invariants: unique name and password never in plain text.

**Aggregate: leaderboard entry (`LeaderboardEntry`).** One per player and
table (variant, and level in Fit and Sort), with the best score and its date.
Invariant: it only improves; on equal score the earliest date wins (RN-43).

**Value objects:** `Username`, `PasswordHash`, `Role`, `ScoreSubmission`
(variant, level, score, seed, moves, duration and `sessionId`), `StarCount`.

**Domain service:** score plausibility check, on the server (RN-39).

**Events:** `UserRegistered`, `ProgressUpdated`, `ScoreAccepted`,
`ScoreRejected`.

**Repositories:** `IProgressRepository` (local and remote implementations),
`IUserRepository`, `ILeaderboardRepository`.

## Content context

**Aggregate: level definition (`LevelDefinition`).** Identity `levelId`; a
common part and a part specific to the variant. Invariants: immutable once
published and always at the end of the order (RN-37); in Fit, the pieces'
area equals the figure's and there is a solution (RN-13).

**Aggregate: seed configuration (`SeedConfig`).** One per variant, and per
level in Sort. Invariant: if the mode is fixed, it has a value.

**Value objects:** `Figure`, `StarThresholds`, the parameters of a Sort level,
`SeedMode`.

**Domain services:** level validator (with solution search) and candidate
generator (D-09).

**Factory:** the level Builder.

**Events:** `LevelPublished`, `SeedConfigChanged`.

**Repositories:** `ILevelRepository`, `ISeedConfigRepository`.
