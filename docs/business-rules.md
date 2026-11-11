# Business Rules

Rules the domain must enforce, independent of UI or storage. Each rule has an
origin:

- **Statement** — comes from the project statement.
- **Proposal** — completes what the statement leaves open; decided by the
  team and open to change.

IDs are stable: they are referenced from use cases, user stories, tests and
commits. Do not renumber; add new rules with the next free number.
Decisions (D-xx) are listed in [`architecture.md`](./architecture.md).

## General rules

| ID | Rule | Origin |
|---|---|---|
| RN-01 | Each cell has up to six neighbours, one per direction of the hexagonal neighbourhood. The board has three line axes. | Statement |
| RN-02 | In Hexa Lines and Hexa Fit, a piece can only be placed if all its cells, in their current rotation, fall inside the board (in Hexa Fit, inside the figure) and on free cells. There is no partial placement and no gravity: the piece stays exactly where it is dropped. | Statement |
| RN-03 | In Hexa Lines and Hexa Fit, a piece is a poly-hex of 1 to 5 cells joined by their sides, taken from a single shape catalog. The catalog is configurable, so adding a new shape does not modify the engine. Pieces may rotate where the variant allows it, but never flip. | Statement + Proposal |
| RN-04 | Each variant is assigned a scoring policy and a progress model: high score (Hexa Lines and Hexa Merge), levels with stars (Hexa Fit) or levels (Hexa Sort). Several variants may share the same policy or model. | Statement |
| RN-05 | Every game of a variant with random generation (Hexa Lines, Hexa Sort and Hexa Merge) uses a seed: with the same seed and the same moves, the result is identical. In Hexa Lines and Hexa Merge, the administrator configures the variant's seed mode: random on every game (default) or fixed with a value. In Hexa Sort, the administrator configures the seed mode for each level: fixed (with a value) or random on every attempt. This configuration is not part of the level definition, which is immutable (RN-37). Offline, the app uses the last downloaded configuration or, if it never downloaded one, the default configuration bundled with the app. The seed used is shown when the game ends. The seed is injectable for tests. | Statement |
| RN-06 | Resolving a move is atomic: the next move is only accepted once the previous one is fully resolved. While the UI shows the resolution (lines, cascade, merge), player input is ignored. | Proposal |
| RN-07 | In timed variants (Hexa Fit today), pausing or sending the app to the background stops the game time. In all variants, going to the background pauses the game, and on return it stays paused until the player resumes it. | Proposal |
| RN-41 | Settings (music, effects and language) belong to the device and are not synced with the account. The initial language is the phone's if it is Spanish or English; otherwise English. | Proposal |

## Hexa Lines

| ID | Rule | Origin |
|---|---|---|
| RN-08 | The tray offers 3 pieces, placeable in any order; a new tray is generated only when all 3 have been used. | Statement |
| RN-09 | A line is complete when every cell of a row on any of the 3 axes is occupied; since the board is a hexagon, every row goes from edge to edge. Complete lines are cleared immediately, and a cell shared by two lines is cleared only once. Several lines in the same move form a combo. | Statement + Proposal |
| RN-10 | Score = placed cells + a bonus per line, multiplied by the combo (simultaneous lines) and the streak (consecutive moves that clear lines). Initial values: 1 point per cell and 10 per line, adjustable by configuration. The exact formula is pending (D-08). | Statement + Proposal |
| RN-11 | Pieces do not rotate. | Proposal |
| RN-12 | The game ends when none of the pieces left in the tray fits on the board; if the score beats the saved high score, it replaces it. Leaving a game midway also ends it and its score counts (same in Hexa Merge). | Statement |

## Hexa Fit

| ID | Rule | Origin |
|---|---|---|
| RN-13 | Each level defines a figure (a connected set of cells) and a fixed set of pieces from the catalog whose total area equals the figure's. A level validator (D-09) checks the area and searches for at least one solution; a level that fails either check is rejected. | Statement + Proposal |
| RN-14 | Pieces rotate in multiples of 60° and can be removed and relocated freely. A placed piece can be dragged back to the tray (removal) or directly to another position on the board (relocation, equivalent to removing it and placing it again). If a relocation or rotation leaves the piece in an invalid position, the piece returns to its previous position and no move is counted. | Statement |
| RN-15 | Victory: the figure is covered by all the pieces, with no gaps or overlaps. There is no defeat. | Statement |
| RN-16 | Undo and redo are unlimited; a new move discards the redo history. Undo does not give back game time. | Statement + Proposal |
| RN-17 | Only each placement of a piece on the figure counts as a move, so a relocation counts as one move; removing and rotating do not count. Undo reverts the counter. | Proposal |
| RN-18 | When a level is completed, its score is computed from moves and time (formula in D-08). Stars are awarded by score thresholds defined in the level file: 1 star for completing it, 2 for reaching the first threshold and 3 for reaching the second. | Statement + Proposal |
| RN-19 | There are at least 15 levels of progressive difficulty: difficulty grows with the size and shape of the figure, always using catalog pieces (RN-03). Level n+1 is unlocked by completing level n; completing always awards at least one star (RN-18). | Statement + Proposal |

## Hexa Sort

| ID | Rule | Origin |
|---|---|---|
| RN-20 | Each cell can hold a stack of coloured chips; the player places the stack from the tray on an empty cell. | Statement |
| RN-21 | After placing, the top run of same-colour chips of each adjacent stack is transferred towards the stack with the most chips of that colour in its top run, in cascade, until there are no more transfers. | Statement |
| RN-22 | On a tie in count, the choice is deterministic (by axial coordinate order) so the resolution is reproducible. | Proposal |
| RN-23 | When the top run of a stack reaches 10 or more chips of the same colour, that run is cleared and counts as a completed goal. | Statement |
| RN-24 | Victory: the level's number of goals is reached. Defeat: after the cascade resolves, the board is full and there is no empty cell to place on. | Statement |
| RN-25 | There are at least 10 levels of progressive difficulty: difficulty grows with the number of colours, the height and mix of the stacks, and the number of goals. Level n+1 is unlocked by completing level n (Hexa Sort does not use stars). | Statement + Proposal |
| RN-40 | Each cleared chip is worth 1 point. If the same cascade completes k goals, the points of that cascade are multiplied by k. Values adjustable by configuration. | Proposal |

## Hexa Merge

| ID | Rule | Origin |
|---|---|---|
| RN-26 | The player slides in one of the 6 directions and all tiles advance in that direction until the edge or until they hit another tile. | Statement |
| RN-27 | Two equal tiles that collide merge into one of double value; a tile does not merge more than once per move. If there are three or more equal tiles in a row, the ones closest to the edge being slid towards merge first. | Statement + Proposal |
| RN-28 | A move is valid only if it changes the board; only after a valid move does a new tile (2 or 4) appear on a random empty cell. Initial ratio: 90 % twos and 10 % fours. | Statement + Proposal |
| RN-29 | Score = sum of the values produced by each merge. | Statement |
| RN-30 | Victory: the target tile appears (configurable, 2048 by default) and the player is offered to keep playing to improve the score. Defeat: no move changes the board. | Statement + Proposal |
| RN-31 | A single move can be undone, restoring board, score and the random generator state. The move that causes the defeat cannot be undone. | Statement + Proposal |

## Account, progress and leaderboard

| ID | Rule | Origin |
|---|---|---|
| RN-32 | Registering and logging in require a connection; playing and saving local progress do not. | Proposal |
| RN-33 | There is a single progress entry per user and per `gameId`. | Statement |
| RN-34 | The leaderboard is computed per `gameId` and, in level-based variants, per level. In the global leaderboard, Hexa Fit ranks by the sum of the scores of all its levels, and Hexa Sort the same. In the per-level leaderboard, both rank by the level's score. | Statement + Proposal |
| RN-35 | Operations that require a session (sync progress, view the global leaderboard) check that there is an active session. | Statement (AOP) + Proposal |
| RN-36 | When syncing, the server keeps the best score, the maximum stars per level and the union of completed levels. | Proposal |
| RN-37 | Level definitions use a common schema with a section specific to each `gameId`; a published level is never modified: only new levels are added, always at the end of the order, and progress and leaderboard are linked to the `levelId`. Adding levels is a protected operation (administrator only, D-13). | Statement + Proposal |
| RN-38 | The app bundles a local copy of the levels and updates it from the server when there is a network, without needing a session. | Proposal |
| RN-39 | A score only enters the leaderboard if the server accepts it: it requires a valid session, well-formed data and values within plausible limits for the variant (e.g. the maximum score reachable with the moves made, or a minimum time per level). Submissions per user are rate-limited per minute. | Proposal |
| RN-42 | The account is created with a unique username and a password, without email. On logout, after sending anything pending, the account's progress is deleted from the phone and the app returns to guest mode. | Proposal |
| RN-43 | The leaderboard keeps only each player's best score: one entry per player and variant (and per level in Fit and Sort). On equal scores, whoever achieved it first ranks higher. A score rejected as implausible is logged on the server but not reported to the player. | Proposal |
