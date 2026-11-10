# User Stories

MoSCoW priority: **M** = must, **S** = should (desirable), **C** = could
(optional). Each story becomes one GitHub issue; its acceptance criteria are
part of the Definition of Done. Related use cases are in
[`use-cases.md`](./use-cases.md).

## Epic 1 — Navigation and base experience

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU01 | As a player, I want a main menu with the four variants and settings, so I can choose what to play. | The 4 variants, settings and statistics are shown; navigating needs no connection. | M |
| HU02 | As a player, I want the UI to fit my screen in portrait, so I can play comfortably. | No clipping on at least 3 screen sizes; orientation locked. | M |
| HU03 | As a player, I want to drag pieces onto the board with natural gestures. | Smooth drag and drop; the piece follows the finger; cancelling returns the piece. | M |
| HU04 | As a player, I want to see whether the drop position is valid before dropping. | Green/red highlight in real time; in Hexa Lines, the lines that would be completed are highlighted (CU-03). | M |
| HU05 | As a player, I want to mute music and effects. | The setting persists between sessions. | M |
| HU06 | As a player, I want to switch between Spanish and English. | All texts change without restarting. | M |

## Epic 2 — Generic engine and extensibility

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU07 | As a developer, I want a reusable `Board<TCell>`. | It is instantiated with 4 cell types; tests for neighbourhood, axes and rotation. | M |
| HU08 | As a developer, I want to inject rules per variant with `IGameRules`. | The engine works with a test cell type (test double); no `if` per variant. | M |
| HU09 | As a developer, I want interchangeable piece sources and scoring policies. | Changing the policy does not touch the engine. | M |
| HU10 | As a developer, I want to document how to add a fifth variant. | `docs/EXTENSIBILITY.md` lists the new files and those left untouched. | M |
| HU11 | As a developer, I want one aspect to apply to all variants. | The `ApplyMoveUseCase` log appears for the 4 games without changing their code. | M |

## Epic 3 — Hexa Lines

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU12 | As a player, I want to complete lines on the 3 axes so they disappear and score points. | Lines are cleared on each axis; several at once make a combo. | M |
| HU13 | As a player, I want to get 3 new pieces only when the current ones are used up. | New tray only once all 3 are placed. | M |
| HU14 | As a player, I want the game to end when no piece fits. | Automatic detection; the score is shown and the record saved. | M |

## Epic 4 — Hexa Fit

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU15 | As a player, I want to cover a figure with all the pieces without gaps or overlaps. | Exact victory on covering; overlaps rejected. | M |
| HU16 | As a player, I want to rotate pieces in 60° steps. | Rotation preview before dropping. | M |
| HU17 | As a player, I want unlimited undo and redo. | Command stacks; redo is invalidated by a new move. | M |
| HU18 | As a player, I want stars based on moves and time. | Documented criterion; stars saved per level. | M |
| HU19 | As a player, I want 15 progressive levels with the next ones locked. | 15 levels in JSON; sequential unlocking. | M |

## Epic 5 — Hexa Sort

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU20 | As a player, I want to place a stack and see the cascading transfer. | Transfer towards the stack with the most chips of that colour until stable. | M |
| HU21 | As a player, I want 10 same-colour chips in a stack to be cleared and count as a goal. | Visible goal counter. | M |
| HU22 | As a player, I want to win by meeting the goals and lose when the board fills up. | Correct victory and defeat screens. | M |
| HU23 | As a player, I want 10 progressive levels. | 10 levels in JSON. | M |

## Epic 6 — Hexa Merge

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU24 | As a player, I want to slide in 6 directions and see the tiles move to the edge. | One test per direction. | M |
| HU25 | As a player, I want two equal tiles to merge into double. | A tile does not merge twice per move. | M |
| HU26 | As a player, I want a new tile (2 or 4) after each valid move. | It does not appear if the move did not change the board; reproducible seed. | M |
| HU27 | As a player, I want to undo the last move. | Only 1 level of undo. | M |
| HU28 | As a player, I want to win with the target tile or lose with no moves. | Both endings detected correctly. | M |

## Epic 7 — Progress, account and competition

| ID | Story | Acceptance criteria | Pri. |
|---|---|---|---|
| HU29 | As a player, I want my progress and records saved locally per variant. | They persist after closing the app, without network. | M |
| HU30 | As a player, I want to register and log in. | JWT; clear errors; the game stays usable as a guest. | M |
| HU31 | As a registered player, I want to sync my progress per variant. | One entry per user and `gameId`; automatic retry. | M |
| HU32 | As a player, I want to see the leaderboard per variant and per level. | Query by `gameId` and `levelId`. | M |
| HU33 | As an administrator, I want to add levels from the panel without updating the app. | The app downloads new levels; local backup copy. | M |
| HU34 | As a player, I want to resume an interrupted game. | State restored after background or close. | S |
| HU35 | As an administrator, I want to choose from the panel whether the seed is fixed (with a value) or random in Hexa Lines, in Hexa Merge and in each Hexa Sort level, without publishing a new level. | The change applies to subsequent games; the level definition does not change; only a user with the admin role can do it. | M |
