# Use Cases

Each use case is **generic**: it serves the four variants and is not
duplicated per game. Use cases with a server part also describe what the
backend does. Rules (RN-xx) are in [`business-rules.md`](./business-rules.md);
endpoints in the backend
[`api-contracts.md`](https://github.com/PepeTza/hexablock-backend/blob/main/docs/api-contracts.md).

All use cases are wrapped by the **logging aspect**, except CU-03.

## Summary

### Client (actor: player or guest)

| ID | Use case | What it does | Class |
|---|---|---|---|
| CU-01 | Start game | Chooses variant and level, gets the seed and creates the game | `StartGameUseCase` |
| CU-02 | Apply move | Validates, applies, resolves, evaluates the end and notifies | `ApplyMoveUseCase` |
| CU-03 | Preview move | Tells whether a position is valid before dropping | `PreviewMoveUseCase` |
| CU-04 | Undo move | Reverts the last move (Fit and Merge) | `UndoMoveUseCase` |
| CU-05 | Redo move | Repeats what was undone (Fit); required by the statement | `RedoMoveUseCase` |
| CU-06 | Pause and resume | Stops and resumes the game and its time | `PauseGameUseCase` |
| CU-07 | Finish game | Computes the result and saves high score, stars and unlocks | `FinishGameUseCase` |
| CU-08 | View levels and progress | Lists levels with stars and locks | `LoadLevelsUseCase` |
| CU-09 | Change settings | Sound, music and language | `UpdateSettingsUseCase` |
| CU-10 | Register | Creates an account | `RegisterUserUseCase` |
| CU-11 | Log in and log out | Obtains or discards the JWT | `LoginUseCase` |
| CU-12 | Sync progress | Sends local progress, with an offline queue and guest migration | `SyncProgressUseCase` |
| CU-13 | Submit score | Sends the score to the leaderboard; the server validates it (RN-39) | `SubmitScoreUseCase` |
| CU-14 | View leaderboard | Global or per-level leaderboard | `GetLeaderboardUseCase` |
| CU-15 | Refresh content | Downloads new levels and the seed configuration | `RefreshContentUseCase` |
| CU-16 | Resume game (desirable) | Restores an interrupted game (HU34) | `ResumeSessionUseCase` |

### Admin panel (actor: administrator)

| ID | Use case | What it does | Class |
|---|---|---|---|
| CU-17 | Create level | Draws the figure or defines the stacks, validates (RN-13) and publishes | `CreateLevelUseCase` |
| CU-18 | Configure seed | Chooses a fixed or random seed per variant or per level | `ConfigureSeedUseCase` |

---

## CU-01 · Start game

**Actor:** player or guest. **Trigger:** chooses a variant from the menu
(Lines or Merge) or an unlocked level (Fit or Sort); also from the result
screens with "retry", "next level" or "new game".
**Preconditions:** in Fit and Sort, the level is unlocked (RN-19, RN-25) and
its definition is available on the device (RN-38).

**Main flow**

1. The UI passes the variant (`gameId`) and, if applicable, the level
   (`levelId`).
2. The use case asks the factory registry for that variant's factory, with no
   conditional per variant.
3. In Fit and Sort, it loads the level definition from the local repository.
4. It gets the seed from the last downloaded configuration (RN-05): if fixed,
   it uses that value; if random, it generates a new one. Fit uses no seed.
5. The factory creates the variant's family of objects: rules, piece source
   (with the seed), scoring policy, progress model and board shape.
6. The board is created: empty hexagon in Lines and Merge, the level's figure
   in Fit and the level's initial board in Sort.
7. The initial state is created: score 0 and game in progress; plus the first
   tray in Lines and Sort, the initial tiles in Merge, and the pending pieces,
   counter and clock in Fit.
8. The engine is created with all of the above and the game becomes
   "in progress".
9. The "game started" event is emitted and the initial state is returned to
   the UI.

**Alternative flows**

- **A1. Level locked:** rejected. The UI should not allow it, but the use case
  checks anyway.
- **A2. Level missing or with an invalid definition:** the error is reported,
  the player goes back to level selection and the failure is logged.
- **A3. No seed configuration downloaded** (first launch without network): the
  default configuration bundled with the app is used (random in Lines and
  Merge, a value defined per level in Sort), replaced by the server's as soon
  as there is a connection.
- **A4. Retry:** same level; with a fixed seed the game repeats exactly, with
  a random seed a new one comes out.
- **A5. A game is already in progress or paused:** the player is asked to
  confirm abandoning it; if they accept, it is discarded and the new one
  starts, otherwise the current one continues. If HU34 is implemented, this
  flow will offer "resume or start over".

**Result:** the game is created and in progress, with no moves, and its seed
recorded to show at the end (RF-16) and to send with the score (RN-39).

**Design notes**

- This is where the **Abstract Factory** required by the statement applies:
  one factory per variant produces all the pieces that fit together.
- The factory registry is filled at app start-up. Adding a fifth variant means
  writing its classes and registering its factory with one line of
  configuration, without touching this use case or the engine (OCP).
- The level arrives already built by the **Builder** (when its JSON was loaded
  in CU-15 or created in CU-17); the factory uses it to create the machinery
  that plays it.
- No network needed: everything comes from the device (RNF-06).

---

## CU-02 · Apply move

**Actor:** player or guest. **Trigger:** drops a piece or a stack; removes,
relocates or rotates a piece (Fit); or slides (Merge). Rotating goes through
this use case as one more kind of move, even though it does not count for the
score (RN-17), so that undo can revert it too.
**Preconditions:** the game is in progress, not paused or finished; no other
resolution is running (RN-06).

**Main flow**

1. The UI turns the gesture into a move and hands it to the use case, which
   does not know which variant it is.
2. **Validate:** the variant's rules check the move (RN-02, RN-20, RN-28).
3. **Apply:** the engine executes the move; if the variant allows undo, it
   saves the previous state first (RN-16, RN-31).
4. **Resolve:** the variant's rule is applied: lines (RN-09), none in Fit,
   cascade and goals (RN-21 to RN-23), or merges and a new tile (RN-26 to
   RN-28). If applicable, the tray is refilled (RN-08).
5. **Score:** the scoring policy updates the score and, in Fit, the move
   counter (RN-10, RN-17, RN-29, RN-40).
6. **Evaluate the end:** victory or defeat is checked (RN-12, RN-15, RN-24,
   RN-30).
7. **Notify:** domain events are emitted (RF-06); the UI animates and audio
   plays.
8. The new state is returned to the UI.

**Alternative flows**

- **A1. Invalid move** (step 2): nothing changes and it does not count as a
  move; the piece returns to its place (RN-14) and the UI shows the rejection.
- **A2. A resolution is running:** input is ignored (RN-06).
- **A3. The game ends** (step 6): it becomes victory or defeat and CU-07 is
  launched. In Merge, on winning the player is offered to keep playing
  (RN-30).
- **A4. Relocation in Fit:** counts as a single move, even though internally
  it is remove and place (RN-14, RN-17).
- **A5. Unexpected error:** the game stays exactly as it was; the error is
  logged by the exceptions aspect.

**Result:** if all goes well, the game is in a new, consistent state, with
score and undo history updated and events emitted. If it fails, the game does
not change.

**Design notes**

- The order validate → apply → resolve → evaluate is the **Template Method**
  pattern; each variant only fills in the steps.
- The logging aspect wraps this use case and logs the board before and after,
  in the four variants (statement, 3.5).
- Autosave is not part of this use case: a separate component listens to the
  events and saves (**Observer**), to keep a single responsibility (SRP).

---

## CU-03 · Preview move

**Actor:** player or guest. **Trigger:** while dragging a piece (Lines, Fit)
or a stack (Sort) over the board, every time the finger moves to another cell;
in Fit, also when rotating the piece during the drag.
**Preconditions:** the game is in progress and no resolution is running
(RN-06).

**Main flow**

1. The UI turns the finger position into a cell and builds a candidate move:
   which piece, with which rotation and where.
2. It calls the use case only when the cell changes, not on every pixel of
   the drag, to keep it smooth (RNF-08).
3. The use case asks the engine to validate the move without applying it,
   with the same validation as step 2 of CU-02 (RN-02, RN-20).
4. In Hexa Lines, if valid, it simulates the placement on a copy of the board
   to know which lines would be completed (RN-09).
5. It returns whether the move is valid, which cells the piece would occupy
   and, in Lines, which lines would be completed.
6. The UI paints those cells green if valid or red if not (RF-17, HU04), and
   highlights the lines that would disappear.

**Alternative flows**

- **A1. The piece is outside the board:** nothing is highlighted.
- **A2. Hexa Sort:** the candidate is a single cell, valid if empty (RN-20);
  the cascade is not previewed.
- **A3. Hexa Merge:** not applicable, because sliding has no drag or target
  position.
- **A4. The player drops the piece:** CU-02 is launched and validates again.
  The preview only guides; the final decision belongs to CU-02.

**Result:** the game does not change: it does not count as a move, emits no
events and saves nothing.

**Design notes**

- CU-03 is a **query** and CU-02 a **command** (command–query separation,
  CQS): CU-03 never modifies state.
- Both use the same validation method of the rules, so the preview never
  shows green where CU-02 rejects.
- The line simulation runs on a copy of the board (**Prototype**), without
  touching the original.
- The logging aspect is not applied to this use case, which is called dozens
  of times per drag: it is simply not wrapped with the decorator at start-up,
  without changing its code.

---

## CU-04 · Undo move and CU-05 · Redo move

Only Hexa Fit (unlimited undo and redo) and Hexa Merge (a single undo, no
redo) support them; Hexa Lines and Hexa Sort do not. Every move applied in
CU-02 is stored as a command that knows how to revert itself, in an undo
stack and a redo stack.

### CU-04 · Undo move

**Actor:** player or guest. **Trigger:** taps "undo".
**Preconditions:** the variant supports undo, there is something to undo, the
game is in progress and no resolution is running (RN-06).

1. The use case pops the last command from the undo stack.
2. The command restores the board and the state before the move: score, move
   counter in Fit (RN-17) and random generator state in Merge (RN-31). Fit's
   game time is not given back: it keeps counting the real time played.
3. In Fit, the command moves to the redo stack.
4. The "move undone" event is emitted and the state is returned.

**Alternative flows**

- **A1. Nothing to undo:** the button is disabled; if the request arrives, it
  is ignored.
- **A2. Hexa Merge already used its undo:** it cannot undo again until a new
  move is made (RN-31).
- **A3. Variant without undo** (Lines, Sort): the button does not exist and
  the use case does not accept those variants.
- **A4. The game has ended:** undo is not possible. In Hexa Merge, the move
  that caused the defeat cannot be undone. If it were enabled in the future
  (e.g. as a booster), it could only be used once per game.

### CU-05 · Redo move (Hexa Fit only)

**Actor:** player or guest. **Trigger:** taps "redo".
**Preconditions:** there is something to redo, the game is in progress and no
resolution is running.

1. The use case pops the last command from the redo stack.
2. It executes it again, without validating it again, because the state is
   identical to when it was done.
3. The command goes back to the undo stack and the move counter goes up
   again.
4. The "move redone" event is emitted and the state is returned.

**Alternative flows**

- **A1. Nothing to redo:** the button is disabled.
- **A2. A new move was made after undoing:** the redo stack was emptied
  (RN-16).

**Result (both):** the game is in the state before (undo) or after (redo) the
move, consistently.

**Design notes**

- **Command** pattern: each move is an object that knows how to execute and
  undo itself, and stores a snapshot of the board and state before. Rotating
  is also a command, so it can be undone too.
- The move (`TMove`) is only the data of what the player wants to do; the
  command is the object that executes and reverts it.
- `UndoMoveUseCase` only accepts states that implement `IUndoable`: using it
  with Lines or Sort does not compile (constrained generics and ISP).
- Limits are configuration: each variant's factory creates its history with
  its capacity (unlimited in Fit; 1 and no redo in Merge), with no
  conditionals per variant.
- In Merge, undo does not allow re-rolling the new tile: since the generator
  is restored, repeating the same move produces the same tile.

---

## CU-06 · Pause and resume

**Actors:** the player or guest, and the system when the app goes to the
background (call, app switch, screen off). **Trigger:** the player taps
"pause" or "resume", or the app goes to the background.
**Preconditions:** to pause, the game is in progress; to resume, it is paused.

**Main flow: pause**

1. The player taps "pause" or the app goes to the background.
2. The game goes from "in progress" to "paused".
3. In timed variants (Fit today), the clock stops (RN-07).
4. The "game paused" event is emitted.
5. The UI shows the pause menu: resume, restart, settings (CU-09) and quit.

**Main flow: resume**

1. The player taps "resume".
2. The game goes back to "in progress" and the clock continues from where it
   stopped.
3. The "game resumed" event is emitted.

**Alternative flows**

- **A1. Pausing something not in progress** (already paused or finished):
  nothing happens.
- **A2. Trying to move while paused:** rejected, because CU-02 requires the
  game to be in progress.
- **A3. The app returns from the background:** the game stays paused and the
  pause menu is shown; it never resumes on its own.
- **A4. Restart from pause:** CU-01 is launched as "retry".
- **A5. Quit from pause:** back to the menu. In Lines and Merge, quitting ends
  the game and goes through CU-07: if the score beats the high score, it is
  saved and sent to the leaderboard. In Fit and Sort, quitting without
  completing the level saves nothing.
- **A6. The system kills the app while paused:** the game is lost, unless HU34
  is implemented.

**Result:** the game is paused, with time stopped and no moves accepted, or
back in progress.

**Design notes**

- **State** pattern: each game state is an object that decides what it allows
  (in progress accepts moves and pause; paused rejects moves and accepts
  resume; finished only allows retry or quit), with no conditionals spread
  through the code. States proposed by the statement: `PlayingState`,
  `ResolvingState` (the RN-06 lock), `PausedState`, `GameOverState`,
  `VictoryState` and `MenuState`.
- Saving is not part of this use case: the save component listens to the
  "game paused" event (**Observer**).

---

## CU-07 · Finish game

**Actor:** the system; arrives from CU-02 when the game ends (A3) or from
CU-06 when the player quits (A5).
**Preconditions:** the game has just ended with victory or defeat, or the
player quit. In Hexa Merge, reaching the target tile does not end the game:
the victory is shown and the player may continue, and this use case runs only
once, at the real end (defeat or quit), with the final score.

**Main flow**

1. The use case receives the finished game and the reason: victory, defeat or
   quit.
2. The variant's progress model computes the result: in Lines and Merge,
   whether there is a new record (RN-12); in Fit, on victory, the score from
   moves and time, the stars (RN-18) and the unlock of the next level (RN-19);
   in Sort, on victory, the score (RN-40) and the unlock (RN-25).
3. It saves progress on the device, one entry per variant (RN-33), always
   keeping the best result of each level.
4. If the player has a session, it queues the score submission (CU-13) and
   the sync (CU-12); without network, they stay queued until there is a
   connection (RF-27).
5. It emits the end event ("game finished" or "level completed"), to which
   audio and UI react.
6. It returns the data for the result screen: score, whether it is a record,
   stars, seed (RF-16) and options (next level, new game, retry).

**Alternative flows**

- **A1. Defeat in Sort, or quitting Fit or Sort without completing:** the
  level's progress does not change and no score is sent.
- **A2. Guest:** progress is saved only on the device, with no leaderboard
  (RN-35). When they create an account, their local records are sent to the
  leaderboard and the server validates them like any other (RN-39, CU-12).
- **A3. Saving on the device fails:** the result screen is shown anyway, with
  a warning, and the error is logged by the exceptions aspect.

**Result:** local progress is updated, the server submission is queued if
applicable, and the UI has what it needs for the victory or defeat screen.

**Design notes**

- `FinishGameUseCase` orchestrates the end of the game (evaluates, saves,
  queues and notifies). Saving is a repository method
  (`IProgressRepository.save`), not a separate use case.
- **Strategy:** each variant brings its progress model (`HighScoreProgress`,
  `LevelStarsProgress`, `LevelProgress`); the use case only calls `evaluate`
  and `merge`, with no conditionals per variant.
- It only depends on ports (`IProgressRepository`, `ISyncQueue`,
  `ISessionProvider`, `IEventBus`), so it can be tested without database or
  network (DIP).
- It does not wait for the network: it only queues tasks for CU-12 and CU-13.

---

## CU-08 · View levels and progress

**Actor:** player or guest. **Trigger:** enters Fit or Sort level selection
(RF-15), or the main menu, which shows the Lines and Merge records (HU01).
**Preconditions:** none; works offline.

**Main flow**

1. The UI asks for a variant's progress.
2. In Fit and Sort, the use case reads the level definitions stored on the
   device, in order (RN-38).
3. It reads that variant's saved progress.
4. The variant's progress model computes, for each level, whether it is
   completed, its stars (Fit), its best score and whether it is locked: level
   1 is always unlocked and each level unlocks when the previous one is
   completed (RN-19, RN-25).
5. It returns the list and a summary (total stars in Fit, completed levels in
   Sort). In Lines and Merge it returns only the record.

**Alternative flows**

- **A1. First time:** only level 1 is unlocked.
- **A2. New levels arrived (CU-15):** they appear at the end of the order and
  unlock when the last previous one is completed (RN-37).

**Result:** nothing changes; it is a query.

---

## CU-09 · Change settings

**Actor:** player or guest. **Trigger:** opens settings from the menu or from
pause. Settings: music (on/off), effects (on/off) and language (Spanish or
English) (RF-18, RF-19).

**Main flow**

1. The UI sends the new value.
2. The use case checks it is valid (e.g. the language is supported).
3. It saves it on the device so it persists between sessions (HU05).
4. It emits "settings changed": audio mutes or unmutes instantly and the UI
   switches language without restarting (HU06).

**Alternative flows**

- **A1. First launch:** the initial language is the phone's if Spanish or
  English; otherwise English. Music and effects start on.
- **A2. Change from pause:** applied immediately, including to the music of
  the current game.

**Result:** settings are saved on the device and applied. They are not synced
with the account (RN-41).

**Design notes (CU-08 and CU-09)**

- Unlocking is computed by the same progress model used by CU-07
  (**Strategy**), so there are never two versions of that rule.
- Audio and UI react to settings through **Observer**.

---

## CU-10 · Register

**Actor:** guest. **Trigger:** taps "create account".
**Preconditions:** there is a connection (RN-32).

**Main flow**

1. *Client:* the guest types a username and a password (no email); the client
   checks the format before sending.
2. *Client:* sends `POST /auth/register`.
3. *Server:* validates the format and that the user does not exist.
4. *Server:* stores the password hashed, never in plain text (RNF-10), and
   creates the user with the player role.
5. *Server:* returns a JWT.
6. *Client:* stores the token in the phone's secure storage.
7. *Client:* launches sync (CU-12), which uploads the guest's progress and
   records (CU-07 A2).
8. "Session started" is emitted.

**Alternative flows**

- **A1. No connection:** a notice is shown and the player continues as guest.
- **A2. User already exists:** the server responds `409` and a message is
  shown.
- **A3. Invalid data:** the server responds `400` and the field is marked.
- **A4. Server error:** generic message with a retry option.

**Result:** the account is created, the session started and the guest's
progress syncing.

---

## CU-11 · Log in and log out

**Actor:** player (or administrator, from the web panel).
**Preconditions:** to log in, there is a connection.

**Log in**

1. *Client:* sends username and password with `POST /auth/login`.
2. *Server:* compares the password with the stored hash and returns a JWT with
   the user's role, valid for 90 days.
3. *Client:* stores the token and launches CU-12, which merges server and
   local progress keeping the best (RN-36).

**Automatic renewal**

1. *Client:* every time the app opens with a connection and a session, it
   calls `POST /auth/refresh`.
2. *Server:* returns a new 90-day token. The player sees nothing: whoever
   plays fairly regularly never logs in again.

**Log out**

1. *Client:* finishes sending whatever is queued, if there is a connection.
2. *Client:* deletes the token and the account's local progress (RN-42); the
   app returns to guest mode.

**Alternative flows**

- **A1. Wrong credentials:** `401` with a generic message, without saying
  whether the username or the password failed.
- **A2. Too many attempts:** the server responds `429` and asks to wait.
- **A3. Log out offline with queued submissions:** the player is warned that
  that progress will be lost and asked to confirm.
- **A4. Administrator:** uses this same use case from the web panel; the role
  inside the JWT decides whether they can enter (D-13).
- **A5. Token expired** (90 days without opening the app online): the server
  responds `401` and the player is asked to log in again. Meanwhile, local
  progress and the submission queue are kept and sent after logging in again.

**Result:** the session is started and progress merged, or closed and the
phone in guest mode.

**Design notes (CU-10 and CU-11)**

- The security aspect (authorisation decorator) checks there is a session
  before running CU-12, CU-13 and CU-14 (RN-35), without those use cases
  knowing.
- In the backend, NestJS solves it with guards: one for the JWT and another
  for the admin role.
- Password recovery by email is future work.

---

## CU-12 · Sync progress

**Actor:** the system. Launched after finishing a game (CU-07), on login or
registration (CU-10, CU-11), on opening the app and on regaining the
connection.
**Preconditions:** there is a session (checked by the security aspect, RN-35).

**Main flow**

1. *Client:* takes what is pending from the queue.
2. *Client:* sends each variant's progress with `PUT /progress/{gameId}`.
3. *Server:* merges it with what it had, keeping the best score, the maximum
   stars per level and the union of completed levels (RN-36), and returns the
   result.
4. *Client:* stores the merged progress on the device, so what was played on
   another phone arrives too.
5. *Client:* removes what was sent from the queue and emits "progress synced".

**Alternative flows**

- **A1. No network or the request fails:** it stays queued and is retried,
  waiting a bit longer each time (exception-handling aspect with retries,
  statement 3.5).
- **A2. Token expired:** CU-11 A5 applies.
- **A3. First sync after registering:** uploads all the guest's progress.

**Result:** device and server progress are equal and merged.

**Design note:** sending the same thing twice gives the same result, because
the merge always keeps the best; that makes retries safe.

---

## CU-13 · Submit score

**Actor:** the system, from the queue (after CU-07, or with the guest's
records on registering).
**Preconditions:** there is a session.

**Main flow**

1. *Client:* sends a score with `POST /scores`: variant, level, score, seed,
   number of moves, duration and a unique game identifier.
2. *Server:* validates it (RN-39): session, format, plausible values for
   those moves and that duration, and rate limit per minute.
3. *Server:* if it is the player's best score for that variant (or that
   level), updates their leaderboard entry (RN-43).
4. *Server:* responds whether it was accepted and the resulting position.
5. *Client:* removes it from the queue.

**Alternative flows**

- **A1. Implausible score:** the server responds `422`; it is not retried, it
  is logged and the player is not told.
- **A2. Too many submissions:** `429`; retried later.
- **A3. No network:** stays queued.
- **A4. The same submission arrives twice** (due to a retry): the server
  recognises it by the game identifier and does not count it twice.

**Result:** the score is recorded in the leaderboard if valid and the
player's best, or discarded and logged if implausible.

---

## CU-14 · View leaderboard

**Actor:** player with a session (RN-35). **Trigger:** opens the leaderboard
from the menu or from the result screen.

**Main flow**

1. The player chooses the variant and, in Fit and Sort, the global or a
   level's leaderboard.
2. *Client:* requests `GET /leaderboard/{gameId}?levelId=`.
3. *Server:* returns the top 50 and the player's position (D-12). Lines and
   Merge rank by score; a Fit or Sort level by the level's score; Fit and
   Sort global by the sum of scores (RN-34). On equal scores, whoever got it
   first ranks higher (RN-43).
4. *Client:* shows the table, highlights the player and stores a dated copy.

**Alternative flows**

- **A1. Guest:** does not see the leaderboard; is invited to create an
  account.
- **A2. No connection:** the last downloaded leaderboard of that table is
  shown, with its date ("updated 2 hours ago"); if it was never downloaded, an
  offline notice.
- **A3. The player has no score in that table:** the top 50 is shown, without
  their own position.

**Result:** the player sees the leaderboard, current or the last downloaded.

**Design note:** caching aspect (statement 3.5): a decorator keeps the result
for a short interval (e.g. one minute) and avoids repeating the request if the
player reopens the leaderboard right away.

---

## CU-15 · Refresh content

**Actor:** the system. **Trigger:** opening the app with a connection.
**Preconditions:** there is a connection; no session required, because levels
and seed configuration are public (guests receive them too).

**Main flow**

1. *Client:* requests only new levels with
   `GET /levels/{gameId}?after={last level it has}`; since published levels
   never change and are appended at the end, the others need not be
   downloaded.
2. *Server:* returns the new definitions.
3. *Client:* builds each level with the **Builder** and validates it.
4. *Client:* stores the valid levels on the device.
5. *Client:* downloads the seed configuration (`GET /seed-config/{gameId}`)
   and replaces the previous one.
6. "Content refreshed" is emitted and level selection refreshes.

**Alternative flows**

- **A1. No network:** what is on the device is used (RN-38, RN-05).
- **A2. A new level arrives invalid:** only the valid levels before it are
  stored and the error is logged; storing a later one would leave it locked
  forever.
- **A3. The seed configuration changes during a game:** it applies from the
  next game.

**Result:** the device has the latest levels and seed configuration.

---

## CU-16 · Resume game (desirable)

Developed only if HU34 is implemented. Until then, a game interrupted by the
app being closed is lost (CU-06 A6), and CU-01 A5 asks for confirmation to
abandon the current game.

---

## CU-17 · Create level

**Actor:** administrator, in the web panel.
**Preconditions:** logged in with the admin role (CU-11 A4).

**Main flow**

1. Chooses the variant: Fit or Sort.
2. Edits the level on the hex grid. In Fit, draws the figure by clicking
   cells, chooses the pieces from the catalog and sets the star thresholds. In
   Sort, defines the initial board (blocked cells and pre-placed stacks), the
   colours, the tray stack parameters and the goals.
3. Optionally, the generator proposes a candidate as a starting point, which
   the administrator reviews and adjusts (D-09).
4. Taps "validate": the Builder assembles the level and validates it. In Fit,
   that the area matches and it has a solution (RN-13), and the panel draws
   the solution found over the figure. In Sort, that it has free cells, at
   least one colour and at least one goal.
5. In Sort, chooses the level's seed mode (required; "random" is selected by
   default).
6. Taps "publish": the server checks the admin role and the format of the
   level, assigns the next place in the order and stores it as immutable
   (RN-37). In Sort it also stores its seed
   configuration (CU-18).

**Alternative flows**

- **A1. Validation fails:** the reason is shown ("area does not match",
  "no solution") and it is not published.
- **A2. The user is not an administrator:** the server responds `403`.
- **A3. The administrator closes the tab without publishing:** the
  half-finished level is kept as a draft in the browser and recovered on
  return; drafts are not stored on the server.
- **A4. A level was published with a design error:** it cannot be modified or
  deleted (RN-37); that is why validation and the solution view matter.

**Result:** the level is published at the end of the order and phones receive
it on the next content refresh (CU-15).

---

## CU-18 · Configure seed

**Actor:** administrator, in the web panel.

**Main flow**

1. Chooses the variant and, in Sort, the level.
2. Sees the current mode.
3. Chooses "random" or "fixed"; if fixed, types the value or taps "generate"
   for the panel to propose one.
4. Saves with `PUT /seed-config/{gameId}?levelId=`.
5. *Server:* validates the value, stores it and records who changed it and
   when.
6. Phones receive it the next time the app opens (CU-15).

**Alternative flows:** the user is not an administrator (`403`) or the value
is invalid (`400`).

**Result:** the seed configuration is updated for subsequent games.

**Design note (CU-17 and CU-18):** the panel lives in the client repo and
imports the game's level validators directly (D-16), so it never approves a
level the game considers invalid. The server only checks the format, and the
game validates every level again when it downloads it (CU-15 A2).
