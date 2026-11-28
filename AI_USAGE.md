# AI Usage

How the team uses generative AI in this repository, as required by section 7
of the project statement. The team is responsible for all delivered code,
whether or not it was AI-assisted, and must be able to explain any part of it.

## 1. Tools

| Tool | Model / version | Role in the workflow |
|---|---|---|
| Claude (claude.ai) | Claude Opus 5.5 | Requirements analysis, business rules, use cases, domain model, API contract, repository documentation. Consulted for design options; decisions are taken by the team. |
| Claude Code | To be recorded per entry | Implementation of approved tasks through the harness (`harness/`). Writes code and tests under human approval at each gate. |
| Antigravity | Gemini | Design review, geometry refactoring (`ICoord` / `HexCoord`) and verification under human approval at each gate. |

Add a row when a new tool is used.

## 2. Usage log

One entry per significant use. Copy the template.

### Template

```markdown
### [YYYY-MM-DD] — [Task]

- **Tool / model:**
- **Issue / PR:**
- **Prompt (literal or faithful paraphrase):**
- **Result:** what the AI produced (code, design, explanation).
- **Team modifications:** what was changed, rejected or corrected, and why.
- **Lessons / limitations:**
```

### 2026-11-04 to 2026-11-10 — Pre-implementation documentation

- **Tool / model:** Claude (claude.ai), Claude Opus 5.5.
- **Issue / PR:** initial repository skeleton.
- **Prompt (paraphrase):** review the project statement and the team's draft;
  detect inconsistencies; propose and refine requirements, business rules,
  use cases, the DDD model, the class diagram structure, the API contract,
  contribution rules and this repository skeleton, one piece at a time and
  explaining new concepts.
- **Result:** technical document (requirements, rules RN-01..43, use cases
  CU-01..18, user stories, DDD model, decisions), API contract,
  `CONTRIBUTING.md`, `AGENTS.md`, the harness and templates.
- **Team modifications:**
  - Business rules corrected by the team (e.g. Hexa Fit score based on moves
    and time, relocation counted as one move, levels immutable and only
    appended).
  - Seed configuration moved to an admin panel after clarification with the
    professor.
  - The AI first proposed squash-and-merge; it was replaced by rebase-and-merge
    because squash would erase the granular, per-author history the statement
    requires.
  - The team chose composition (`Board<TCell>` with an injected geometry)
    among the options presented.
- **Lessons / limitations:** the AI tends to propose more classes and patterns
  than needed; the team keeps only what it can justify. Diagram import into
  Lucidchart lost generic type parameters and had to be fixed manually.

### 2026-11-11 — Implementation plan and I0 issues

- **Tool / model:** Claude Code, Claude Opus 5.5.
- **Issue / PR:** #13.
- **Prompt (paraphrase):** read both repositories' docs and propose, as a
  gate 1 plan only, the iterations until 2026-12-14, a work split in three
  tracks, the issues, labels and milestones, the folder structure, the setup
  task, how to use agents and skills, and the decisions still open.
- **Result:** the plan now in `docs/implementation-plan.md`; the 15 issues of
  I0 (client #3–#12, backend #3–#7).
- **Team modifications:**
  - The first split gave Hexa Lines and Hexa Merge to one track and both
    level-based variants to another, leaving one member without a variant.
    The team required every member to own at least one variant; the split was
    redone.
  - The AI proposed creating all 83 issues, milestones and a GitHub Projects
    board at once. The team chose to create issues per iteration only, with
    no milestones and no board.
  - A separate progress file was proposed and dropped: `harness/phase-log.md`
    already records completed work.
  - The plan was written in Spanish for the team and translated to English
    for the repository; track letters were replaced by the members' names.
- **Lessons / limitations:** the AI stated two wrong facts that the team had
  to question: that GitHub issues cannot be deleted (repository owners can
  delete them), and issue counts per repository it had not actually counted.
  Counts and platform facts from the AI must be checked before acting on them.

### 2026-11-10 — Expo app setup (issue #5)

- **Tool / model:** Claude Code.
- **Issue / PR:** #5, PR #15.
- **Prompt (paraphrase):** set up the React Native app with Expo, strict
  TypeScript, ESLint, Prettier, Jest and commit hooks, following the
  approved plan, with a plan first and one commit per tool.
- **Result:** six commits: line-ending rules, the Expo SDK 58 template with a
  placeholder home screen, ESLint and Prettier, Jest with one screen test and
  the 80 % coverage threshold, husky with commitlint and lint-staged, and the
  documented commands.
- **Team modifications:**
  - The team member asked for the commit footer to read
    `AI-Assisted: Claude Code` without the model id; this differs from
    `AGENTS.md` and was agreed in the session. The first commit, already
    pushed, keeps the longer footer.
  - The AI proposed rebasing the branch onto `main`; the force push it
    needed was blocked, and the member chose a merge instead, which leaves a
    merge commit to flatten before the pull request is merged.
  - The member decided to see commits 4 to 6 together and approve them in
    one answer.
- **Lessons / limitations:**
  - The AI first planned to leave the coverage threshold for a later task;
    issue #5 required it, and Jest fails on a threshold path with no
    coverage data, so the threshold is enabled only when `src/domain` or
    `src/application` exists.
  - The AI's first attempt to normalise line endings changed nothing; this
    was noticed because the before and after counts were identical.
  - Verified by opening the app with Expo Go on an Android emulator (done by
    the AI, with a screenshot and a log check) and on a real phone (done by
    the team member).

### 2026-11-11 — Shared agent skills

- **Tool / model:** Claude Code, Claude Opus 5.5.
- **Issue / PR:** #12.
- **Prompt (paraphrase):** write the agent skills listed in §6 of the
  implementation plan and link them from `AGENTS.md`.
- **Result:** five `SKILL.md` files (`harness-task`, `aaa-test`,
  `log-ai-usage`, `add-variant`, `design-level`) and §7 of `AGENTS.md`. The
  three shared ones were copied to the backend (backend #7).
- **Team modifications:** none yet; to be reviewed in the pull request.
- **Lessons / limitations:** the first draft of `design-level` stated two
  undecided points as rules (fixed level ids, file naming); they were
  rewritten as open questions before committing.

### 2026-11-11 — Plan and documentation review

- **Tool / model:** Claude Code, claude-fable-5-1.
- **Issue / PR:** no issue; branch `claude/tender-babbage-cx0n60` in both
  repositories.
- **Prompt (paraphrase):** review the implementation plan against the
  documents of both repositories and note, in a separate document, the
  inconsistencies, missing files and wrong data; then write a note for the
  team on the problems of the open pull requests and a pull request that
  corrects the documents, explaining every decision before opening it.
- **Result:** `docs/plan-review-2026-11-11.md` (23 findings); the corrections
  of the plan, `architecture.md`, `requirements.md`, `use-cases.md`,
  `README.md`, `CONTRIBUTING.md` and the backend contract; a team note on the
  open pull requests.
- **Team modifications:** to be recorded after the review of the pull
  request.
- **Lessons / limitations:** the AI found that two open pull requests had
  resolved merge conflicts by deleting another member's rows and entries,
  something a human review of the diff would also catch if it looked at
  removed lines, not only added ones. The AI's own commits in the cloud
  session came out authored as `Claude` (the problem it was reporting), so
  the git identity must be set at the start of every session.

### 2026-11-11 — Layer and variant boundaries (issue #8)

- **Tool / model:** Claude Code, Claude Opus 5.5.
- **Issue / PR:** #8.
- **Prompt (paraphrase):** pick the open issues that do not wait for other
  members, then implement #8 through the harness, explaining every concept
  and decision before writing code.
- **Result:** `eslint-boundaries.config.js` with `no-restricted-imports`
  blocks per layer and per variant, wired into `eslint.config.mjs`; the
  `@domain`, `@application`, `@adapters` and `@frameworks` aliases in
  `tsconfig.json` and `jest.config.js`; a Jest test with 13 cases that runs
  the rules on sample imports.
- **Team modifications:**
  - The issue said adapters may import frameworks "except the composition
    root". The AI pointed out that the composition root lives in
    `frameworks/` and imports adapters, never the reverse; the team approved
    a rule with no exception.
  - The AI first planned a hand-written list of variant names. While
    explaining it, it proposed reading the folders of `src/domain/variants`
    instead, so a fifth variant needs no lint change; the team chose that.
  - The `admin/` rule was left to #7 because decision 19 (what the panel may
    import) is still open. The AI recommended allowing `src/domain` and
    `src/application`; the team has not recorded the decision yet.
  - The team member set the git author for all future cloud sessions
    through environment variables, after the identity problem came up in
    three sessions.
- **Lessons / limitations:** the plan said the test would run ESLint as a
  separate process with an `.mjs` config; during the build the AI switched
  to ESLint's `Linter` class inside Jest and a CommonJS config file, which
  was simpler, and reported the change at gate 3. A first run reported two
  errors for one aliased import (two patterns matched it); the pattern was
  narrowed before committing. The AI needed several explanations with
  examples (folder tree, what a linter and an alias are) before the plan
  could be approved: explaining the concepts first would have saved time.

### 2026-11-11 — Hex coordinates and geometry (issue #9)

- **Tool / model:** Claude Code, Claude Opus 5.5.
- **Issue / PR:** #9.
- **Prompt (paraphrase):** implement #9 through the harness, explaining
  each concept before asking for approval.
- **Result:** `Coord`, `Direction`, `Axis`, `IBoardGeometry` and
  `HexGeometry` (neighbours, lines along an axis, rings, 60° rotation) in
  `src/domain/engine/geometry`, with 30 test cases.
- **Team modifications:**
  - The hex orientation was not in any document; the AI asked and the team
    chose pointy-top, recorded as D-21.
  - The team approved that the geometry does not know the board edges
    (`line` receives `isInside`), because boards will not always be perfect
    hexagons.
  - The first version had the six directions and three axes fixed inside
    `Direction` and `Axis`. The team asked whether squares would need those
    files changed; they would, against `docs/EXTENSIBILITY.md`. The AI
    proposed that each geometry declares its own directions and axes
    (`HexDirection`, `HexAxis`); the team compared it with an abstract
    `Direction` with subclasses and chose the plain class.
- **Lessons / limitations:** the AI's first plan claimed the geometry was
  replaceable while `Direction` and `Axis` were hex-only; the team's
  question exposed it. TypeScript compares types by shape, so subclasses of
  `Direction` would not stop mixing directions of two geometries; a runtime
  check in `HexGeometry` does.

### 2026-11-12 — Generic board (issue #10)

- **Tool / model:** Claude Code, Claude Opus 5.5.
- **Issue / PR:** #10.
- **Prompt (paraphrase):** implement #10 through the harness, explaining
  generics, composition, the board shape and Prototype before asking for
  approval.
- **Result:** `BoardShape` (radius and free-form) and `Board<TCell>` with
  `cellAt`, `place`, `remove`, neighbours, lines, rotation and `clone()` in
  `src/domain/engine/board`, with 23 test cases and four test cell types.
- **Team modifications:**
  - The AI first named the board methods `get`, `set` and `clear`. The team
    questioned getters and setters; they were renamed to the domain terms
    `cellAt`, `place` and `remove`.
  - The AI also proposed a read-only view (`IReadonlyBoard<TCell>`) so that
    only the rules could change the board; the team rejected it for now.
  - The team approved an empty cell as `undefined`, with the constraint
    `TCell extends NonNullable<unknown>`, and a mutable board with
    `clone()`, as `use-cases.md` describes.
- **Lessons / limitations:** the AI said a Hexa Fit cell holds "which piece
  occupies the cell"; the team pointed out that a piece covers several
  cells (each cell holds the `PieceId` of the piece covering it). While
  building, the AI noticed that a negative radius gave an empty shape
  without an error and added the check. `clone()` copies cells, not the
  values in them, so cell types must stay immutable.

### 2026-11-17 — Coordinate contract ICoord and HexCoord (issues #9, #10)

- **Tool / model:** Antigravity (Gemini).
- **Issue / PR:** #25 (follow-up on #9 and #10; branch `refactor/25-coord-generic-geometry`).
- **Prompt (paraphrase):** review the repository state and project statement,
  advise how to keep the geometry layer ready for future 2D/3D topologies
  (`RNF-14`) without rewriting the engine, update the implementation plan and
  refactor the affected geometry and board files accordingly.
- **Result:** `ICoord` (`coord.ts`), `HexCoord` (`hex-coord.ts`),
  parameterised `IBoardGeometry<TCoord extends ICoord = HexCoord>` (with
  `origin` and `rotationSteps`), `BoardShape<TCoord>` and
  `Board<TCell, TCoord>`, 4 new test cases (including 3D test coordinates),
  and updated design documentation (`implementation-plan.md`,
  `architecture.md`, `EXTENSIBILITY.md`, `glossary.md`, `domain-model.md`).
- **Team modifications:**
  - The AI first suggested adding an optional `z = 0` attribute to `Coord`. The
    team rejected it because every 2D board would carry a dead-weight `z = 0`
    attribute and a hexagonal `.s` getter would be mixed into 3D coordinates.
    It was replaced by `ICoord` + `TCoord extends ICoord = HexCoord`.
  - The AI kept the name `Coord` for the hexagonal class; the team pointed out
    the asymmetry with `HexDirection`, `HexAxis` and `HexGeometry`, so it was
    renamed `HexCoord`.
  - The AI proposed adding `_axis?: Axis` to `IBoardGeometry.rotate` and
    ignoring it in `HexGeometry`. The team caught that this violates ISP and
    makes no mathematical sense in 2D (where rotating around an in-plane axis
    would flip the piece, forbidden by RN-03); `rotate` stayed planar and 3D
    axis rotation was left for a segregated interface.
- **Lessons / limitations:** initial AI proposals tried to pack 3D concerns
  into 2D types via optional fields and ignored parameters; questioning each
  design choice against SOLID (ISP, LSP) and domain invariants caught all
  three issues before writing code.

### 2026-11-18 — Admin panel setup (issue #7)

- **Tool / model:** Claude Code, claude-opus-5-5.
- **Issue / PR:** #7.
- **Prompt (paraphrase):** implement issue #7 through the harness and explain
  every step, so the owner can defend it.
- **Result:** Vite + React + strict TypeScript app in `admin/`; the `@domain`
  alias in Vite and tsconfig with a page that computes a radius-4 board with
  the domain; ESLint with an import boundary and six tests proving it; root
  type-check, Jest and lint-staged adjusted to ignore or lint `admin/`.
- **Team modifications:**
  - The owner approved `jsdom`, `@types/react` and `@types/react-dom`, missing
    from the plan's dependency list, and the D-19 boundary as recorded today
    (only `src/domain`), since decision 19 is still open.
  - The owner checked that the engine (Track A) is only used, not modified.
- **Lessons / limitations:**
  - The root type-check was silently checking the panel, including its build
    output; found by listing the files TypeScript included.
  - `jsdom` 31 needs Node 22.19 (through `undici` 8); `jsdom` 29 is the newest
    that runs on the Node 22.13 the repository declares.
  - The first commit message was rejected by commitlint (77 characters);
    the hook worked as intended.
  - The panel has no CI job yet: the client CI is issue #6.

### 2026-11-20 — Piece catalog as data (issue #29)

- **Tool / model:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Issue / PR:** #29 (T12); follow-up issue #56.
- **Prompt (paraphrase):** after a class-by-class walkthrough of the engine,
  plan and build T12 following the harness, explaining every new concept, so
  the owner can explain the code.
- **Result:** `PieceShape`, `Piece` and `PieceCatalog` in `engine/pieces/`;
  `translate` in `IBoardGeometry`; the hexagonal data (`hex-pieces.json`, 21
  shapes) and its loader in `engine/hex/`; 20 tests; `docs/piece-catalog.md`
  with every shape drawn. The 48 shapes of 1 to 5 cells were enumerated with
  a throwaway script (not in the repository) and checked against OEIS A006534.
- **Team modifications:**
  - The owner found that placing a piece needs coordinate translation, which
    the geometry did not offer (RNF-14 forbids reading `q` and `r`); `translate`
    was added after his approval.
  - The AI proposed keeping `equals` in `ICoord` "until T12 needs it". The
    owner asked why to keep unused code; a compiler test showed that without
    `equals`, `ICoord` accepts any value. The comment of `coord.ts` was
    corrected and the deeper fix (`key()`) became issue #56.
  - The owner asked for 6 base 5-cell shapes plus a page listing the other 27,
    so the Hexa Lines owner can change the selection.
  - The owner questioned whether the rotation-duplicate check was needed; it
    was kept because it is what proves the hand-checked catalog is complete.
- **Lessons / limitations:**
  - The fixture linter of the lint tests does not parse `import type`; found
    when two fixtures failed with a parsing error.
  - The choice of the 6 shapes of 5 cells is a guess at variety, not tested
    with players; the Hexa Lines owner reviews it.

### 2026-11-21 — Game engine, rules template and domain events (issue #27)

- **Tool / model:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Issue / PR:** #27 (HU08).
- **Prompt (paraphrase):** plan and build the engine with the harness,
  explaining it with concrete examples before deciding; the owner chose to
  build it without the planned mob sessions.
- **Result:** `GameEngine` (moves played on a copy of the board, the four
  session states of D-22, listeners, `preview`), `IGameRules` and
  `BaseGameRules` (Template Method), `GameState`, the engine events and
  `IScoringPolicy<TResolution>`; 18 tests with two test variants.
- **Team modifications:**
  - The owner asked for the design to be explained with a worked example and
    a class diagram before answering the four design questions.
  - The owner chose the Template Method in `BaseGameRules`, the scoring policy
    on the resolution of the move injected into the rules (the documents said
    `IScoringPolicy<TState>`; they were updated), a minimal `GameState` and
    `preview` in this task.
  - The mob sessions of the plan were replaced by a walkthrough for the team.
- **Lessons / limitations:**
  - TypeScript rejects extra fields in an object literal typed as the base
    `DomainEvent`; a union of the engine events (`EngineEvent`) keeps each one
    checked against its exact shape.
  - `play` of `BaseGameRules` must not be overridden, but TypeScript has no
    `final`: it is stated in the doc comment only.
  - `board` and `state` of the engine are readable and the board is mutable:
    nothing stops a caller from changing it directly.

### 2026-11-21 — Interchangeable piece sources and seeded random (issue #28)

- **Tool / model:** Antigravity, Gemini 4 Neon.
- **Issue / PR:** #28 (HU09).
- **Prompt (paraphrase):** recommend the next I1 issue to tackle, then plan
  and implement #28 through the harness, explaining the design and checking
  the owner's understanding before committing.
- **Result:** `IRandomSource` and `SeededRandom` (`mulberry32`, cited in code
  and `README.md`) in `src/domain/engine/random/`; `IPieceSource<TPiece>`,
  `FixedPieceSource<TPiece>` and `RandomPieceSource<TPiece>` (uniform and
  weighted) in `src/domain/engine/pieces/`; 24 unit/integration tests proving
  determinism, weighted draws, independent cloning and swapping strategies
  without modifying `GameEngine`; updated `docs/architecture.md` and
  `README.md`.
- **Team modifications:**
  - Before approving the plan, the owner asked how `FixedPieceSource` and
    `RandomPieceSource` differ and how Hexa Lines and Hexa Sort plug into
    `IPieceSource` (reusing vs composing/implementing custom sources).
  - Before approving the second commit, the owner questioned `Iterable<TPiece>`
    (confirming it is TypeScript's built-in iteration protocol, not our GoF
    Iterator implementation) and reviewed why `clone()` (Prototype) encapsulates
    internal state, why `RandomPieceSource` validates weights eagerly (fail
    fast), and why `GameEngine` stays unaware of `IPieceSource` and
    `IScoringPolicy` (OCP).
- **Lessons / limitations:**
  - `tsconfig.json` enables `noUncheckedIndexedAccess: true`, which caught
    direct array indexing in `SeededRandom.pick` and `pickWeighted` on the
    first type-check; `pickWeighted` was rewritten without casts using a
    `for...of` loop tracking the last entry.
  - `commitlint` rejected the first commit attempt because the unwrapped body
    exceeded 100 characters (`body-max-line-length`); wrapping the body at 72
    characters fixed it.

### 2026-11-21 — Admin panel application-layer boundary (issue #46)

- **Tool / model:** Antigravity, Gemini 4 Neon.
- **Issue / PR:** #46 (follow-up of #7, #8 and #45).
- **Prompt (paraphrase):** explain what #46 is based on and what it unblocks,
  confirm `src/domain` already forbids external packages, and implement #46
  through the harness.
- **Result:** `@application` alias configured in `admin/tsconfig.json` and
  `admin/vite.config.ts` (including `server.fs.allow`); updated
  `admin/eslint-boundaries.js` and `eslint-boundaries.config.js` so `admin/`
  may import `@application/*` while `src/application/**` forbids external
  packages (D-19); updated fixtures (9 panel tests, 19 root boundary tests);
  updated `AGENTS.md` and `README.md`; fixed stale `HexGeometry` import path in
  `admin/src/App.tsx` left behind by #53 in a separate commit.
- **Team modifications:**
  - The issue text suggested removing `application` from both the alias and
    relative-path patterns in `admin/eslint-boundaries.js`; after explaining the
    layer rule in plain terms, the owner approved keeping relative `src/` paths
    forbidden for both `domain` and `application` so the panel always uses the
    aliases consistently.
  - The owner approved fixing the broken `HexGeometry` import in
    `admin/src/App.tsx` in a separate `fix(panel)` commit so `admin/` builds
    and passes type-check and tests cleanly.
- **Lessons / limitations:**
  - Because `admin/` is excluded from root `tsc` and Jest (and CI #6 is not yet
    in place), moving `HexGeometry` in #53 silently broke `admin/src/App.tsx`
    until `admin/` checks were run locally.

### 2026-11-21 — Generic game use cases and logging aspect (issue #30)

- **Tool / model:** Antigravity, Gemini 4 Neon.
- **Issue / PR:** #30 (HU11).
- **Prompt (paraphrase):** explain #30 in Clean Architecture layer terms,
  discuss Builder vs engine patterns and run a 5-question conceptual check
  before planning and building #30 through the harness.
- **Result:** Domain contracts (`IVariantFactory`, `VariantFactoryRegistry`,
  `IGameSession`, `PlayerProgress` + `mergeProgress`, `IProgressModel`,
  `SeedConfig`), layer-2 ports (`ILogger`, `IClock`, `IProgressRepository`,
  `ISeedConfigRepository`, `ISeedGenerator`, `ILevelRepository`,
  `ISessionProvider`, `ISyncQueue`, `IEventBus`), `StartGameUseCase` (CU-01),
  `ApplyMoveUseCase` (CU-02), `FinishGameUseCase` (CU-07), and
  `LoggingUseCaseDecorator` (AOP via Decorator, RNF-04) with 20 tests using
  fake ports (100 % line coverage in `src/application`).
- **Team modifications:**
  - Before approving the plan, the owner questioned why domain contracts were
    part of a use-case task (clarifying the inward dependency rule: layer 1
    variants must implement `IVariantFactory` and `IProgressModel` without
    importing layer 2) and completed a 5-question defence check covering DIP,
    OCP/Abstract Factory, Template Method/Strategy, AOP/Decorator and generic
    constraints.
  - Before approving Commit 1, the owner asked for a file-by-file plain
    explanation of the new domain contracts.
- **Lessons / limitations:**
  - `GameEngine<TCell, TCoord, TMove, TState>` is invariant in `TCell`/`TCoord`
    and contravariant in `TMove`, so a heterogeneous `VariantFactoryRegistry`
    cannot store `GameEngine<unknown, ...>` without `any`; introducing the
    structural `IGameSession<TMove = never, TState extends GameState = GameState>`
    view solved it cleanly in strict TypeScript with zero `any` and zero edits
    to `GameEngine`.
  - `@typescript-eslint/require-await` caught `async` test fakes without
    `await`; switching them to `Promise.resolve`/`Promise.reject` fixed all
    lint errors.

### 2026-11-21 — Main menu with variants and settings (issue #36)

- **Tool / model:** Antigravity, Claude Opus 5.5 (after starting the session on Gemini 4 Neon).
- **Issue / PR:** #36 (HU01).
- **Prompt (paraphrase):** explain #36 in Clean Architecture layer terms before
  Gate 1, run architecture-focused check questions, obtain approval per commit,
  and handle push, PR, rebase-and-merge and cleanup after Gate 4.
- **Result:** Installed React Navigation dependencies (`@react-navigation/native`,
  `@react-navigation/native-stack`, `react-native-screens`,
  `react-native-safe-area-context`), added `LoadProgressSummaryUseCase` in
  `src/application/use-cases/` (CU-08 summary), `MainMenuPresenter`,
  `MENU_VARIANTS` and `InMemoryProgressRepository` in `src/adapters/`, and
  `composition-root.ts`, `ServicesContext`, `RootNavigator`, passive
  `MainMenuView`, `HomeScreen` container, `SettingsScreen` and
  `VariantPlaceholderScreen` placeholders in `src/frameworks/`, with 13 new
  unit/navigation tests (174/174 total).
- **Team modifications:**
  - Before Gate 1, the owner asked why menu presentation belonged to Track A
    (answered from `docs/implementation-plan.md` §2).
  - Raised iOS playability via a web build and asked to document abandoning
    Skia on web as an option, which was separated into its own docs issue
    (decision 23).
  - Challenged the §4 rule that only `composition-root.ts` imports adapters,
    leading to clarifying it as "instantiates adapters" (while allowing type
    imports for view models).
  - Questioned the need for `LoadProgressSummaryUseCase` versus T28's
    `LoadLevelsUseCase`, accepting the split after comparing responsibilities
    (summary query across all variants vs per-variant unlock rules).
  - Asked what the large diff blocks shown before commits were, shifting later
    commit previews to `--stat` plus key files and full diffs for docs.
- **Lessons / limitations:**
  - `@testing-library/react-native` v14 exposes async `render` and `fireEvent`
    APIs (`await render(...)`, `await fireEvent.press(...)`).
  - `@react-navigation/native-stack` rendered and navigated inside Jest under
    `jest-expo` without requiring global Jest config changes or extra mocks.
  - Prettier flagged minor formatting differences in generated test files on
    the first verification pass, so running `prettier --write` before
    verification prevented hook failures.

### 2026-11-21 — Victory and defeat screens showing the seed (issue #38)

- **Tool / model:** Antigravity, Gemini 4 Argon.
- **Issue / PR:** #38 (T14).
- **Prompt (paraphrase):** explain #38 in Clean Architecture layer terms and ask
  two architecture/design check questions before Gate 1; obtain approval per
  commit; push, open PR, rebase-and-merge and clean up branch after Gate 4.
- **Result:** Added `GameResultPresenter` and `GameResultViewModel` in
  `src/adapters/presentation/game-result/` (5 unit tests), passive
  `GameResultView` and `GameResultScreen` container in
  `src/frameworks/ui/screens/` (4 component tests), `GameResult` route in
  `routes.ts` / `RootNavigator.tsx` (1 navigation test) and presenter wiring
  in `composition-root.ts` (184/184 tests passing).
- **Team modifications:**
  - Before Gate 1, the owner answered the two design questions confirming that
    `GameResultPresenter` formats optional fields (`seed`, `stars`,
    `unlockedLevelId`, `isNewRecord`) based on data presence in
    `FinishGameOutput` rather than branching on `gameId` (OCP), and clarified
    `CU-07 A3` (when `saveFailed` is `true`, `FinishGameUseCase` has already
    caught and logged the storage failure, and the result screen renders a
    non-blocking warning banner).
- **Lessons / limitations:**
  - Passing optional `initialRouteName` and `initialResultParams` props to
    `RootNavigator` (defaulting to `'Home'`) allowed testing the `GameResult`
    screen transition back to `'Home'` inside the real native stack navigator
    with zero mocks.

### 2026-11-21 — Require explicit key() in ICoord instead of toString (issue #56)

- **Tool / model:** Antigravity, Gemini 4 Argon.
- **Issue / PR:** #56.
- **Prompt (paraphrase):** recommend between #41 and #56, then explain #56 in
  plain language and design terms, ask two architecture/design check questions
  before Gate 1, obtain approval per commit, and handle push, PR,
  rebase-and-merge and cleanup after Gate 4.
- **Result:** Narrowed `ICoord` (`src/domain/engine/geometry/coord.ts`) to
  `key(): string` (ISP), updated `Board`, `BoardShape` and `PieceShape` to
  index cells via `coord.key()`, added `key()` to `HexCoord` while keeping
  `equals()` and `toString()`, simplified `TestCubeCoord` test doubles, and
  added a compile-time `@ts-expect-error` type test in `hex-coord.test.ts`
  (185/185 app tests and 9/9 panel tests passing).
- **Team modifications:**
  - Before Gate 1, the owner answered the two design questions on TypeScript
    structural typing (`Object.prototype.toString` vs explicit `key()`) and
    coordinate opacity (`RNF-14`), and chose Option 1 (ISP: `ICoord` requires
    only `key(): string`, keeping `equals` on `HexCoord`).
- **Lessons / limitations:**
  - `@typescript-eslint/no-base-to-string` caught calling `.toString()` on a
    variable typed as `ICoord` once `toString()` was removed from `ICoord`;
    testing the compile-time rejection via a helper `(coord: ICoord) =>
    coord.key()` with `@ts-expect-error` satisfied both ESLint and
    `tsc --noEmit`.

### 2026-11-22 — Keep piece sources inside move atomicity (issue #111)

- **Tool / model:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Issue / PR:** #111.
- **Prompt (paraphrase):** audit the Track A work of I0 and I1 and check that
  it makes sense; then go through the findings from the most important one,
  explaining the options with their pros, cons and the principles each one
  keeps or breaks, before any decision; then plan and build #111 through the
  harness with approval per commit.
- **Result:** the audit found that the engine copies the board but not the
  piece source, so a preview or a failed move would advance the real
  generator (RN-05). The AI drafted the issue and, after the decision,
  built `IPrototype<T>`, `Snapshot<T>` (Memento) and `SourcedGameRules`
  with 12 tests, plus the docs (architecture, extensibility guide,
  `add-variant` skill).
- **Team modifications:**
  - The owner rejected the first recommendation (the engine owns an optional
    source with a Null Object) because games that need no source should not
    have to carry one, and proposed using the Template Method to standardise
    the clone.
  - The owner added the requirement that any present or future variant must
    be able to get unlimited undo and redo, which changed the recommendation
    to a snapshot that cannot be advanced; the owner then asked how to close
    the remaining hole (a variant forgetting to store the new snapshot),
    which led to combining the snapshot with the Template Method.
  - In gate 1 the owner approved generalising the source type to `TSource`
    (any clonable source, so Merge can keep an `IRandomSource`) instead of
    `IPieceSource<TPiece>` as the issue text said.
- **Lessons / limitations:**
  - The AI first overstated the undo benefit; once the owner asked which
    variants have undo, the AI corrected the argument (only Merge has both a
    source and undo, with one level) and the decision rested on keeping T20
    generic instead.
  - The other audit findings stay as provisional recommendations, to be
    reviewed one by one before any issue or code.
  - `@typescript-eslint/no-unsafe-call` rejects calling a method that does
    not exist even under `@ts-expect-error`; the type test reads the missing
    properties into `unknown` instead.
  - The tests were checked by removing the line that stores the new snapshot:
    exactly the two tests that protect that hole failed.

### 2026-11-22 — Notify after the move and return what happened (issue #113)

- **Tool / model:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Issue / PR:** #113.
- **Prompt (paraphrase):** review the remaining audit findings one at a time,
  in plain language and with a concrete example each, letting the owner
  explain them back before deciding; open the issues for the start of I2,
  with the ones that affect teammates first; then plan and build #113
  through the harness with approval per commit.
- **Result:** the AI found, by running a temporary test, that the engine
  notified listeners before moving the session to `resolving` (a throwing
  listener lost the outcome of a winning move; a listener could slip in a
  second move), that `ApplyMoveOutput.outcome` was always `null`, and that
  `IGameSession` accepted moves of another variant because TypeScript checks
  method parameters bivariantly. It then built an event outbox delivered
  after each action, listener isolation with `onListenerError`, `MoveResult`
  returned by `applyMove`, `applyMove` as a function-typed property, tests
  for the ignored transitions of CU-06, and the doc updates.
- **Team modifications:**
  - The owner questioned whether the move-type mix-up could really happen,
    and checked that the fix kept the dependency rule: no generic code may
    depend on a concrete variant. That fixed where the one explicit cast
    lives (each variant's presentation factory), and the owner chose this
    minimal fix (a function-typed property plus that cast) over the typed
    registry keys the AI had first recommended, after the AI admitted it had
    overstated the risk.
  - The owner set the priority rule for the follow-up issues: those that can
    affect teammates go first.
  - In gate 1 the owner approved applying the outbox to every action, not
    only to moves.
- **Lessons / limitations:**
  - The first explanations of these findings were too dense to be
    understood; one concept at a time, with a concrete example and an
    explanation back, worked.
  - The tests were checked by reverting the fixes: delivering events
    immediately again failed the three tests that protect the bug, and
    declaring `applyMove` as a method again failed the type test.
  - Sources cited: the WHATWG DOM Standard ("inner invoke") for isolating
    listeners, and the TypeScript 2.6 release notes for function parameter
    variance.

### 2026-11-22 — Refresh the main menu on focus (issue #114)

- **Tool / model:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Issue / PR:** #114.
- **Prompt (paraphrase):** plan and build #114 through the harness with
  approval per commit.
- **Result:** `HomeScreen` reloads the progress with `useFocusEffect` every
  time the menu becomes visible, and `MainMenuPresenter` returns the whole
  menu without progress labels when loading fails, with tests for both and
  a minimal navigation stack in `HomeScreen.test.tsx`.
- **Team modifications:** none beyond the decisions taken in the audit (the
  fallback lives in the presenter, not in the screen).
- **Lessons / limitations:**
  - In tests, the stack header's back button is not a pressable button, so
    the test goes back through a navigation container reference instead; a
    throwaway probe test checked this before planning.
  - The first version of the test failed on its own data ("Best: 0" for both
    Lines and Merge), not on the code.
  - Checked by reverting to `useEffect`: the "new record" test failed.

### 2026-11-22 — Typed end-of-game events and resilient queueing (issue #115)

- **Tool / model:** Claude Code, Claude Opus 5.5 (`claude-opus-5-5`).
- **Issue / PR:** #115.
- **Prompt (paraphrase):** plan and build #115 through the harness with
  approval per commit.
- **Result:** the `GameFinished` and `LevelCompleted` event types in
  `domain/progress/progress-events.ts`, published with their data by
  `FinishGameUseCase`; a private `attempt()` helper so a failing save,
  session check or queue task only logs a warning; progress sync queued
  only after a successful save; `StartGameUseCase` rejecting a level that
  `findByGame` does not list; eight new or updated tests; domain model and
  CU-07 updated.
- **Team modifications:** none beyond the decisions taken in the audit. The
  team accepted two choices made during planning: the score submission is
  still tried when queueing the progress sync fails, and the events live in
  the progress domain, not in the engine.
- **Lessons / limitations:**
  - The plan had `attempt()` return a boolean; while building it became
    generic with a fallback value, because the session check needs the
    value it returns. It is a private helper, so the change was reported
    instead of re-planned.
  - The existing quit test also asserted the old `GameOver` event; that
    assertion moved to a dedicated quit test with the full event data.
  - Checked by mutation: removing the not-found guard, syncing after a
    failed save and calling the session check without `attempt()` each
    made its guarding test fail. The first run passed the source file to
    Jest, which ran no tests; it was repeated with the test file.
  - The first docs commit header was 73 characters and commitlint rejected
    it; it was shortened.

### 2026-11-22 — Log only allow-listed use case data (issue #116)

- **Tool / model:** Antigravity, Claude Opus 5.5.
- **Issue / PR:** #116 (follow-up of HU11 #30).
- **Prompt (paraphrase):** review open issues, verify whether Swarm fits #116,
  explain the logging risk on error messages, and implement the allowlist for
  `LoggingUseCaseDecorator` through the harness.
- **Result:** added `UseCaseLogDescription<TInput, TOutput>` and an optional
  `describe` parameter to `LoggingUseCaseDecorator` (defaulting to name,
  `durationMs` and error message only), updated and added unit tests
  including the password leak check, and documented the allowlist in
  `docs/architecture.md` §6.
- **Team modifications:**
  - Before approving gate 1, the owner asked for the trade-off on logging
    error messages without `describe` and chose option A (keep the message,
    and add the rule in `docs/architecture.md` §6 that error messages never
    contain user data).
  - Approved rewriting the two existing tests that expected raw `input` and
    `output` logging.
- **Lessons / limitations:**
  - A generic AOP decorator sees every use case's payload; without an
    explicit allowlist (`describe`), future use cases such as login would
    silently leak secrets or whole engine objects.

### 2026-11-22 — Command history for undo and redo (issue #58)

- **Tool / model:** Antigravity, Gemini 4 Argon (with Orchestrator and Claude
  Opus 5.5 in earlier turns).
- **Issue / PR:** #58 (`T20`).
- **Prompt (paraphrase):** review #58 through the harness, resolve doc
  inconsistencies (`CU-04`/`CU-06` session transitions and `IUndoable`),
  discuss how in-game booster Decorators can unlock extra undos mid-game, and
  implement generic command history in `GameEngine`.
- **Result:** added `src/domain/engine/commands/` (`ICommand`, `IUndoable`,
  `ApplyMoveCommand`, `CommandHistory` separating `maxDepth` from
  `allowancePerMove` + `grantUndo`), `MoveUndone` / `MoveRedone` events,
  `PlayingState` / `GameEngine` `undo()`, `redo()`, `canUndo`, `canRedo` and
  `grantUndo()`, 14 new unit and integration tests (245 / 245 app, 9 / 9 panel),
  aligned `docs/architecture.md` and `docs/use-cases.md`, and created #123
  for `UndoMoveUseCase` / `RedoMoveUseCase`.
- **Team modifications:**
  - Chose option A on `CU-06`: `undo` and `redo` stay in `PlayingState` and
    are ignored (return `false` with no events) when empty or not playing.
  - Kept #58 scoped strictly to `src/domain/engine/` and split layer-2
    use cases (`CU-04`, `CU-05`) into #123.
  - Asked for mid-game boosters (such as `+1` undo from 0→1 or 1→2) to stay
    decoupled via Decorator, leading to separating `maxDepth` from
    `allowancePerMove` and adding `grantUndo`.
- **Lessons / limitations:**
  - Separating history retention (`maxDepth`) from permission (`allowance`) in
    `CommandHistory` avoids breaking OCP later when booster Decorators unlock
    undo mid-game in variants without baseline undo.

### 2026-11-22 — Undo and redo move use cases (issue #123)

- **Tool / model:** Antigravity, Gemini 4 Argon.
- **Issue / PR:** #123 (CU-04, CU-05, follow-up of #58).
- **Prompt (paraphrase):** implement #123 through the harness (gate 1 plan,
  `UndoMoveUseCase`, `RedoMoveUseCase`, AAA tests and Gate 4 docs).
- **Result:** added segregated interface `IUndoableSession<TState>` in
  `src/domain/engine/commands/command.ts`, created `UndoMoveUseCase` and
  `RedoMoveUseCase` in `src/application/use-cases/` plus 7 tests covering
  undo, redo, booster-granted undo, ignored non-playing/empty states and
  `LoggingUseCaseDecorator` allowlist logging (100 % coverage; 252 / 252 app,
  9 / 9 panel).
- **Team modifications:** none; implemented the approved gate 1 plan as
  specified.
- **Lessons / limitations:**
  - Segregating `IUndoableSession` instead of adding `undo()`/`redo()` to
    `IGameSession` avoided churning existing session test doubles in
    `StartGameUseCase`, `FinishGameUseCase` and `VariantFactoryRegistry` tests
    (ISP).

### 2026-11-22 — Carousel main menu with list toggle (issue #117)

- **Tool / model:** Antigravity, Gemini 4 Argon.
- **Issue / PR:** #117 (improvement on HU01 #36).
- **Prompt (paraphrase):** implement #117 through the harness (gate 1 plan,
  circular carousel by default with swipe/arrows, demo placeholder, list mode
  toggle and tests, without touching the engine or `package.json`).
- **Result:** added pure `stepCarouselIndex`, `toggleMenuMode` and
  `resolveCarouselSwipe` helpers to `main-menu-presenter.ts` (with `MainMenuMode`
  and `CarouselStep` in `main-menu-view-model.ts`), updated `MainMenuView.tsx`
  with React Native's built-in `PanResponder` and `Animated` (no new
  dependencies), demo placeholder pointing to #118 and `☰` / `◫` toggle, and
  updated presenter and screen tests (`257 / 257` app, `9 / 9` panel).
- **Team modifications:** none; confirmed with the owner before starting that
  `src/domain/` and `src/application/` stayed completely untouched.
- **Lessons / limitations:**
  - Keeping circular wrap-around and swipe threshold resolution as pure
    functions in layer 3 lets them be tested independently of React Native
    gesture internals while keeping `MainMenuView` a Humble View.
  - Testing in Expo Go on a real phone caught that a child `<Pressable>`
    claimed the JS touch responder before the parent `PanResponder` captured
    horizontal movement; fixed in a follow-up (`onMoveShouldSetPanResponderCapture`
    at 10 px, `translateX` feedback, outer touch listeners separated from
    `panHandlers` so React Native Testing Library keeps touch events enabled,
    and drag-suppression on `onPress`; `258 / 258` app, `9 / 9` panel).

### 2026-11-22 — Client CI

- **Tool / model:** Codex.
- **Issue / PR:** #6.
- **Prompt:** Set up client CI now that the Expo app and admin panel exist,
  keeping the in-progress Skia changes in a separate checkout.
- **Result:** Added separate GitHub Actions jobs for the Expo app and Vite
  panel using the backend workflow as a reference. Isolated Jest from panel
  tests after reproducing cross-discovery on Windows.
- **Team modifications:** Jesus approved adding Vitest's V8 coverage provider
  for the panel.
- **Lessons / limitations:** The workflow still needs a GitHub run. Vitest
  reports panel coverage; Jest enforces the shared domain and application
  thresholds.

### 2026-11-23 — Hexa Lines clearing and scoring

- **Tool / model:** Codex (GPT-6).
- **Issue / PR:** #31.
- **Prompt (paraphrase):** Implement three-axis clears and D-08 scoring
  in an isolated branch from origin/main, write tests first, and assess
  a streak cap. Leave the changes local for review.
- **Result:** Added the Lines resolution step, the scoring policy, and
  tests for each axis, crossing lines, streak reset, and score examples.
- **Team modifications:** Pending review.
- **Lessons / limitations:** Board geometry already enumerates rows.
  Discovering all full rows before removing cells preserves crossing
  combos. The uncapped streak has a bound based on move count for RN-39.
  The tray and end-of-game rules are separate tasks (#32 and #33).
### 2026-11-23 — Level definition, builder and validator port

- **Tool / model:** Codex (GPT-6).
- **Issue / PR:** #60 (T22).
- **Prompt:** Implement the level definition, JSON Builder and validator port
  for RN-13 and RN-37 in an isolated checkout, with tests first and no
  speculative Fit or Sort schema.
- **Result:** Added an immutable level snapshot, field-specific errors for
  malformed common data and a validator port for variant playability checks.
- **Team modifications:** Pending team review.
- **Lessons / limitations:** Backend #32 owns the variant-specific JSON
  format. The Builder preserves the spec as JSON and leaves version support
  and playability to the variant validator.

### 2026-11-23 — Align Hexa Sort rules with the project statement

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #133.
- **Prompt (paraphrase):** check the project statement against both
  repositories, then align the client docs with the Hexa Sort format of
  backend #42.
- **Result:** a read-only audit of the statement against both repositories,
  and RN-23, the glossary, the domain model, HU21 and decisions 10 and 11
  updated to a tray of one stack and whole-stack removal.
- **Team modifications:** The statement removes the whole stack at 10 chips
  of one colour, while RN-23 cleared only the top run and was labelled
  Statement. The owner chose the statement.
- **Lessons / limitations:** The AI first checked the Sort values only
  against decision 10 and proposed a tray of up to 3 stacks; the statement
  had to be read first. Issue #73 still has the old title.

### 2026-11-23 — Hexa Lines seeded tray

- **Tool / model:** Codex (GPT-6).
- **Issue / PR:** #32.
- **Prompt (paraphrase):** Implement the RN-08 seeded three-piece tray on
  top of #31 in a separate worktree, covering D-07 weights and orientations.
  Write tests first and leave the changes local for review.
- **Result:** Added the Lines piece source and session. Tests cover tray
  replacement, rejected placements, seeded previews, and the #31 scoring
  integration.
- **Team modifications:** Pending review.
- **Lessons / limitations:** D-07 gives no numeric spawn weights, so every
  shape starts at weight 1 and can be configured by ID. The source
  snapshot prevents previews from consuming future pieces.

### 2026-11-23 — Hexa Fit figure coverage

- **Tool / model:** Codex (GPT-6).
- **Issue / PR:** #71 (HU15).
- **Prompt:** Implement the Fit placement core on top of #60 using
  catalog-resolved pieces and tests first.
- **Result:** Added a typed session starter, Fit placement rules and engine
  tests for exact coverage, invalid placements and preview.
- **Team modifications:** Pending team review.
- **Lessons / limitations:** Session-local piece IDs distinguish copies of
  the same catalog shape. The starter expects an already resolved figure
  and pieces. Rotation interactions, undo and solution search are separate.
### 2026-11-23 — Client architecture diagrams

- **Tool / model:** Codex.
- **Issue / PR:** #41.
- **Prompt:** Prepare the Track B Clean Architecture and extensibility
  diagrams from the agreed client design.
- **Result:** Added Mermaid sources, scalable SVG exports and README links.
- **Team modifications:** Jesus reported that the professor accepts image
  exports. The written Lucidchart requirement remains documented.
- **Lessons / limitations:** The client class diagram is tracked separately
  within #41. Both SVGs were rendered and checked locally.

### 2026-11-23 — Hexa Merge six-direction tile sliding (issue #59)

- **Tool / model:** Antigravity (Gemini 4 Argon).
- **Issue / PR:** #59 (HU24).
- **Prompt (paraphrase):** explain what HU24 is based on and what each Clean
  Architecture layer needs, then produce and execute the gate 1 plan for
  Hexa Merge six-direction sliding inside `src/domain/variants/hexa-merge/`
  without touching the generic engine.
- **Result:** created the `Tile` value object (power-of-two invariant),
  `SlideMove` and geometry-agnostic `slideTiles` ray compaction (using only
  `IBoardGeometry.neighbour` and `ICoord.key()`), `MergeRules` (`BaseGameRules`
  subclass), `startMergeGame` on the radius-2 hex board, and unit tests
  covering all six directions plus multi-tile packing and atomic rejection
  (`334 / 334` app, `9 / 9` panel).
- **Team modifications:** replaced 32-bit bitwise power-of-two checking in
  `Tile` with safe integer division so powers of two at or above 2^31 are
  handled without truncation; tested collision ordering with distinct tile
  values so future merge rules in #69 remain compatible.
- **Lessons / limitations:** tracing rays from cells without a predecessor in
  the slide direction and sliding backwards from the target edge prepares the
  exact traversal order needed for closest-to-edge merge precedence (RN-27) in
  #69 while keeping hex coordinates opaque outside `HexGeometry`.

### 2026-11-23 — Admin login

- **Tool / model:** Codex.
- **Issue / PR:** #63.
- **Prompt:** Complete the admin-only login using the existing API contract.
- **Result:** Added a role-aware use case, HTTP adapter and panel form.
- **Team modifications:** None recorded.
- **Lessons / limitations:** The browser needed a wrapper around fetch.
  Role checks passed against simulated API responses; deployment is separate.

### 2026-11-23 — CommandService with Either and zero production type casts (issue #146)

- **Tool / model:** Antigravity (Gemini 4 Argon).
- **Issue / PR:** #146.
- **Prompt (paraphrase):** align Layer 2 AOP use cases with Mark Seemann's
  `CommandService` + `Either<Error, TResult>` whiteboard pattern from class,
  remove all production `as` type casts, and document the rule in `AGENTS.md`
  and `docs/architecture.md`.
- **Result:** created `Either<TLeft, TRight>` (`Left`/`Right` with `fold`,
  `map`, `mapLeft`, `flatMap`), replaced `IUseCase` with `CommandService` and
  `AsyncCommandService`, refactored `LoggingCommandServiceDecorator`, added
  `ExceptionHandlingCommandServiceDecorator` (`<<aspect>>`), migrated all 7
  use cases (including `LoginUseCase` after rebasing on #63), `MainMenuPresenter`
  and `admin/src/App.tsx`, removed the remaining 4 `as` casts from
  `src/domain/engine/`, and updated `AGENTS.md` and `docs/architecture.md`
  (`345 / 345` app, `17 / 17` panel).
- **Team modifications:** separated `CommandService` and
  `AsyncCommandService` into explicit sync/async contracts instead of mixing
  `TOutput | Promise<TOutput>`, eliminating the 3 `as` casts in the logging
  decorator; kept exception-throwing tests aligned with ESLint's
  `only-throw-error` rule.
- **Lessons / limitations:** checking `src/` with `grep " as "` confirmed zero
  production type assertions remain (`as const` literal narrowing and `export`
  aliases only). Keeping the rule in `AGENTS.md` ensures all team members and
  agents follow `CommandService` + `Either` without casts.

### 2026-11-23 — Hexa Fit undo and redo

- **Tool / model:** Codex.
- **Issue / PR:** #81.
- **Prompt:** Give Fit unlimited undo and redo under RN-16 and RN-17.
- **Result:** Reused the generic command history and verified that undo restores
  the board, tray and move count. A successful move clears the redo history.
- **Team modifications:** None recorded.
- **Lessons / limitations:** Elapsed time belongs to the session clock, outside
  the command history. The clock test in the Fit screen draft (#155) verifies
  that undo does not give back time.

### 2026-11-23 — Hexa Fit placement rotation preview

- **Tool / model:** Codex.
- **Issue / PR:** #80.
- **Prompt:** Use the catalog piece's 60-degree rotation for preview and drop.
- **Result:** Preview and placement use the rotated cells for validation. A
  failed placement keeps the piece in the tray and the move count unchanged.
- **Team modifications:** None recorded.
- **Lessons / limitations:** The two tests fail on the previous rules in
  opposite directions. The Fit screen integration in #155 handles gestures.

### 2026-11-23 — Hex board projection

- **Tool / model:** Codex.
- **Issue / PR:** #34 (projection review in #149).
- **Prompt:** Translate touch positions to board coordinates through a
  presentation port shared by the game renderers.
- **Result:** Added the generic projection interface and the axial hex
  implementation. Tests cover cell round trips and boundary cases.
- **Team modifications:** PepeTza reviewed the separation between the
  projection and the renderer and requested landing the projection first.
- **Lessons / limitations:** The native drag interaction still needs device
  verification. The projection can be tested independently of rendering.

### 2026-11-24 — Generic line resolution

- **Tool / model:** Codex.
- **Issue / PR:** #165 (Lines resolver).
- **Prompt:** Remove the HexCoord dependency from the shared line resolver.
- **Result:** The resolver and its event retain the board's coordinate type.
- **Team modifications:** The issue specifies the generic coordinate bound.
- **Lessons / limitations:** The regression first failed at type-checking.
  It also checks that the non-hex board is cleared at runtime.

### 2026-11-24 — Generic Fit rules

- **Tool / model:** Codex.
- **Issue / PR:** #165 (Fit rules).
- **Prompt:** Keep Fit placement rules independent of concrete coordinates.
- **Result:** Fit state, moves and rules share the board coordinate type.
  The Fit factory still supplies the hex geometry.
- **Team modifications:** The issue specifies the generic coordinate bound.
- **Lessons / limitations:** The non-hex control first failed type-checking.
  It also exercises placement and victory through the rules at runtime.

### 2026-11-24 — Lines game configuration

- **Tool / model:** Codex.
- **Issue / PR:** #165 (Lines configuration).
- **Prompt:** Let the Lines factory take board, tray and placement defaults.
- **Result:** Added options for the board shape or radius, tray size,
  color and piece weights. Existing callers can still pass weights second.
- **Team modifications:** The issue specifies configurable rule values.
- **Lessons / limitations:** The non-default board test expected seven cells
  but got 61 before the change. It also checks refilling a two-piece tray.

### 2026-11-24 — Fit piece edits

- **Tool / model:** Codex.
- **Issue / PR:** #87 (domain piece edits).
- **Prompt:** Reuse the Fit draft's piece edits on the generic domain in main.
- **Result:** The rules handle relocation, removal and in-place rotation.
  Command history restores the footprint and tray state.
- **Team modifications:** The game rules define how each action counts (RN-17).
- **Lessons / limitations:** Relocation and removal tests first returned
  rejected. The tests also cover invalid changes and rotation without a
  move charge. Native interaction is tracked separately.

### 2026-11-23 — Hexa Fit score and stars

- **Tool / model:** Codex.
- **Issue / PR:** #83.
- **Prompt:** Apply the D-08 Fit score and award stars from each level's thresholds.
- **Result:** Added a Fit progress strategy and a domain victory summary that
  calculates the score. The test plays a real move and saves the stars
  through the progress port.
- **Team modifications:** PepeTza requested configurable scoring parameters
  and scoring in the domain in the #160 review.
- **Lessons / limitations:** The test uses a temporary progress store and test
  thresholds. The mobile screen and persistent repository are tracked separately.
  The integration test follows the Either result introduced by #146.

### 2026-11-23 — Level selection query and view

- **Tool / model:** Codex.
- **Issue / PR:** #90.
- **Prompt:** Display Fit stars, Sort completion and sequential locks. Adapt
  the selection query to the asynchronous command contract introduced by #146.
- **Result:** Added the CU-08 query and the shared mobile list. A progress
  read failure returns a controlled result. The view takes a maximum star count.
- **Team modifications:** None recorded.
- **Lessons / limitations:** Navigation and local data providers are integration
  work. Component tests cover locked and unlocked levels with fixtures.

### 2026-11-24 — Generic Fit solution search

- **Tool / model:** Codex.
- **Issue / PR:** #72 and #165 (solution search).
- **Prompt:** Extract the geometry-independent solver from the Fit validator.
- **Result:** Added exact cover search and verified that identical catalog
  pieces remain distinct even on non-hex coordinates.
- **Team modifications:** The #139 review requested generic coordinates.
- **Lessons / limitations:** Removing the used-piece guard made the test
  return piece indices [0, 0] instead of [0, 1]. The validator and publication
  flow still need the agreed level contract.

### 2026-11-24 — Typed Lines placement preview

- **Tool / model:** Codex.
- **Issue / PR:** #35 (preview) and #165 (coordinate independence).
- **Prompt:** Expose the simulated footprint and cleared cells independently
  of the Lines screen.
- **Result:** The engine carries each variant's event type through preview.
  The Lines adapter maps the typed cells without a runtime subtype check.
- **Team modifications:** The #159 review requested removing that check.
- **Lessons / limitations:** Reading the cells failed with TS2339 before the
  engine retained the event type. Preview leaves live state and listeners
  untouched. Native drag remains part of the Lines screen verification.

### 2026-11-24 — README generic-engine explanation

- **Tool / model:** Codex.
- **Issue / PR:** #99 (layers and extensibility).
- **Prompt:** Replace the generic-engine placeholder with verified examples.
- **Result:** Explained the engine constraints and linked the domain
  implementations and tests for coordinate reuse.
- **Team modifications:** None recorded.
- **Lessons / limitations:** A link check found 10 valid local paths and
  failed when one path was replaced in a copy. Final README work remains
  linked to the release and contributions from the other tracks.

### 2026-11-23 — Hexa Sort stacks and cascade (issue #61)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #61.
- **Prompt:** Plan and build HU20: place the tray stack on an empty cell and
  transfer top runs in cascade until the board is stable, with a
  deterministic tie-break, following the Hexa Lines pattern.
- **Result:** `ColorStack` value object, seeded `SortStackSource`, the
  `resolveCascade` queue algorithm, `SortGameRules` on the engine's Template
  Method, `createSortGame` and `createHexSortGame`, `SortScoringPolicy`, 43
  tests and `docs/rules/hexa-sort.md`.
- **Team modifications:** The team chose the transfer semantics (top run,
  longest run wins, resolving cell first on a tie). A teammate pointed out
  that the first `createSortGame` built a hexagonal board inside it, breaking
  OCP; it now receives the geometry and the figure, and a square-board test
  proves another shape needs no change. RN-22 was reworded without axial
  coordinates (#164).
- **Lessons / limitations:** The AI first wrote two `as number` casts, which
  `AGENTS.md` forbids; they were replaced with explicit `undefined` checks.
  The tray limits (2-8 colours, heights 1-9) duplicate the API contract.

### 2026-11-23 — Design-for-change rule (issue #162)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #162 (twin: PepeTza/hexablock-backend#48).
- **Prompt (paraphrase):** after the review of backend #43 found plausibility
  limits fixed at 19 cells, write the rule "never assume a requirement will
  not change" into the repositories so every teammate's agent sees it, and add
  a subagent that asks "what if tomorrow they ask for this?", bounded by the
  kinds of change the teacher raised in class.
- **Result:** a "Design for change" rule in `CONTRIBUTING.md` §4 and
  `AGENTS.md` §4, a review bullet in `CONTRIBUTING.md` §3, the shared
  `change-scenarios` skill (late change test, catalog of six kinds of change,
  out-of-bounds list, three verdicts, guard against over-engineering), a
  read-only Claude Code subagent, and a "Change scenarios" section in the
  gate 1 plan (template, checklist, `harness-task` skill).
- **Team modifications:** Ronald supplied the catalog from the teacher's
  examples in class (cell geometry, 2D to 3D, database swap, multiplayer) and
  added triangles and frameworks; renamed the measure from a single day before
  the delivery to a late change of requirements in the last days; and added
  the "human first" rule, so the planner or reviewer writes their own scenario
  before the skill, which stays a second opinion. Commits were reordered so
  the rule never links to a skill that does not exist yet.
- **Lessons / limitations:** in a dry run on the merged backend #43, with no
  human scenario given, the subagent reminded the reviewer to add their own,
  found the 19-cell limits on its own, and also found hand-copied rule values
  (`FIT_MAX_SCORE = 1000`, the Lines factor `1125`) that the human review had
  missed. New subagent definitions load only when a Claude Code session
  starts. Ronald will confirm with the teacher that using this subagent in
  reviews is acceptable.
- **Update (same day):** until the teacher approves it, Ronald removed the
  `change-scenarios` skill, its subagent and the "Change scenarios" section
  of the gate 1 plan; only the "Design for change" rule remains. Restoring
  them is a revert of that commit.

### 2026-11-24 — Implementation plan review and alignment (issues #174, #168)

- **Tool / model:** Claude Code (claude-opus-5-5) and Antigravity (Gemini 4 Neon).
- **Issue / PR:** #174 (absorbs #168).
- **Prompt:** Audit every section of `docs/implementation-plan.md` against both
  repositories (code, docs, issues, PRs, CI and branch protection) without
  rewriting the plan, then walk through the 36 findings one decision at a time.
- **Result:** Audited 36 findings across both repositories and applied the
  resolutions directly to `docs/implementation-plan.md` §1–§8 (including
  decision 23 for iOS web build and item 16 in §8) and `docs/architecture.md`
  (`TEvent` in §3, Iterator and `GameServiceFacade` removed from §4, `D-06`,
  `D-08` and `D-23` in §10).
- **Team modifications:** Ronald reviewed and decided each non-mechanical entry
  individually, kept teammate-track changes as pending proposals, enabled
  required CI checks in both repos, verified `origin/main` after #169 merged
  (updating Sort references and dropping already-resolved #164 items from §8),
  and chose to keep each non-architecture decision in its owning document.
- **Lessons / limitations:** Checking live commits, PRs and issues (`#169`,
  `#107`) before proposing each option avoided stale citations and duplicate
  rules across documents.

### 2026-11-25 — Hexa Sort goals (issue #73)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #73.
- **Prompt:** Plan and build HU21: remove stacks of ten or more same-colour
  chips as goals and score them per RN-40, with a visible goal counter.
- **Result:** goal removal inside `resolveCascade` with a `GoalCompleted`
  event, `DEFAULT_CLEAR_AT`, the RN-40 multiplier in `SortScoringPolicy`,
  the `goals` counter in `SortGameState`, 15 tests (2 of them replace older
  scoring tests), and RN-23, RN-40 and
  `docs/rules/hexa-sort.md` updated.
- **Team modifications:** The owner made the three decisions the rules left
  open (#164): the trigger is the top run, not every chip of the colour;
  every chip of a removed stack scores; the check runs after each cascade
  step, once the whole group has moved. The owner also asked for the goal
  size to be changeable (for example to 12), so it lives in one constant and
  reaches the cascade as configuration.
- **Lessons / limitations:** A goal size per level is not possible without a
  new field in the level spec (API contract §6). The RN-40 values are still a
  team proposal, which is why they stay configurable. The gate 4 review found
  that a goal size below a stack's height left completed goals on the board
  and that no test told "after each step" apart from "at the end of the
  cascade"; both were fixed before the PR.

### 2026-11-26 — Hexa Sort victory and defeat (issue #82)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #82.
- **Prompt:** Start #82 (HU22): win by meeting the goals, lose when the
  board fills up, with correct result screens; explain every commit for a
  beginner.
- **Result:** `goalTarget` in `SortSetup` and `evaluateEnd` in the Sort
  rules, `summarizeSortGame`, `SortProgressModel`, 18 tests (domain, the
  finish use case with the real model, and the result presenter) and
  `docs/rules/hexa-sort.md` updated.
- **Team modifications:** The owner chose the scope (domain, summary and
  progress model here; screen wiring in #88), that victory wins when both
  ends happen, and the name `goalTarget` over the API's `goals`, which the
  state already uses for the completed counter. The owner asked to confirm
  the rules hard-code no board size and accept any number of colours. A
  commit header over 72 characters was shortened before committing.
  The gate 4 review by a separate agent found two summary tests without
  `_when_` and no test for a repeat win with an equal score; both were
  fixed in their own commit.
- **Lessons / limitations:** Victory and defeat in one move cannot happen,
  since a goal frees a cell, so that order has no test. No variant has a
  game screen yet, so the result screen is reached only from #88. The
  tests build boards from the stack each seed deals, so they hold for any
  tray colours.
  - The review found that Sort progress saves `stars: 0` while the API
    contract expects `null` for Hexa Sort and rejects a value. Nothing
    syncs progress yet; the future sync (CU-12) must send `null`, as the
    `SortProgressModel` comment says.

### 2026-11-26 — Hexa Merge merges equal tiles (issue #69)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #69.
- **Prompt:** Gate 1 of #69 (HU25, RN-27 and RN-29), including a merge on a
  radius-3 board as commented on #69; walk through the current Merge code
  class by class before the design, and offer each real decision with its
  options.
- **Result:** `merge-tiles.ts` (`mergeTiles`, `MergeResolution`,
  `TileMerged`), `MergeScoringPolicy`, the merge step in `MergeRules`
  (`resolve`, and `validate` accepting a move that only merges),
  `Tile.doubled()`, 13 tests and the 2048 row in README → References.
- **Team modifications:** The owner chose each design option: merging in
  `resolve` instead of in the slide, a resolution with the cell and value
  of each merge scored by its own Strategy, and emitting `TileMerged`
  although the issue does not ask for it. The owner checked that the board
  geometry is chosen in one place only, so a square Merge would need new
  geometry and assembly files and no change to the rules; after comparing
  it with the planned folder structure, he weighed renaming the assembly
  files and kept the current names. The gate 4 review by a
  separate agent suggested `Tile.doubled()`; the owner accepted it in its
  own commit.
- **Lessons / limitations:** The first draft of `mergeTiles` recorded the
  cell of a merge before closing the gaps, so in a line like `[2,2,4,4]`
  the event would name a cell the new tile does not end on; it was
  rewritten to rebuild each line at once before any commit. The engine's
  `MoveResult` does not carry variant events, so the event test plays
  `MergeRules` directly, as Lines and Sort do. A first mutation for "edge
  first" broke a different rule and was redone.

### 2026-11-27 — Hexa Merge tile spawning (issue #70)

- **Tool / model:** Antigravity (Gemini 4 Neon).
- **Issue / PR:** #70.
- **Prompt (paraphrase):** Start issue #70 (HU26, RN-28 and RN-44) following the
  four-gate harness after confirming #70 unblocks #79: move `MergeRules` onto
  `SourcedGameRules`, spawn a 2 (90 %) or 4 (10 %) on a random empty cell
  after valid moves, place configurable starting tiles on non-border cells,
  document RN-44, and cite Gabriele Cirulli's 2048.
- **Result:** `spawn-tile.ts` (`DEFAULT_MERGE_SPAWN_WEIGHTS`,
  `DEFAULT_MERGE_INITIAL_TILE_COUNT`, `TileSpawned`, `interiorCells`,
  `spawnTile`, `spawnInitialTiles`), `MergeRules` migrated to
  `SourcedGameRules` with `Snapshot<IRandomSource>`, `startMergeGame(seed,
  options)`, 14 new tests (`spawn-tile.test.ts`, `merge-game.test.ts`,
  `merge-rules.test.ts`), `RN-44` in `docs/business-rules.md`, and the updated
  2048 reference in `README.md`.
- **Team modifications:** The owner chose to use the same configurable 90/10
  2-or-4 pool for starting tiles (RN-44) as for post-move spawns (RN-28) and
  required citing Gabriele Cirulli's 2048. The gate 4 review by a separate
  agent caught two combined AAA test comments, which were split into explicit
  Arrange / Act / Assert blocks.
- **Lessons / limitations:** `GameEngine.subscribe` types listeners as
  `(event: DomainEvent) => void`, so tests inspecting `TileSpawned` narrow
  the event via a type guard without casts. Running `prettier --write` while
  files were open in the IDE triggered dirty-buffer save conflicts; closing
  `README.md` reverted its unstaged edit and had to be re-checked with
  `git status` before committing.

### 2026-11-27 — Hexa Merge target tile and defeat detection (issue #79)

- **Tool / model:** Antigravity (Gemini 4 Neon).
- **Issue / PR:** #79.
- **Prompt (paraphrase):** Plan and implement #79 (HU28, RN-30, D-22) through
  the four-gate harness after #70 unblocked it: emit `TargetReached` once when
  reaching the configurable target tile while keeping the game playable, and
  end the game as a defeat when no move can change the board.
- **Result:** `DEFAULT_MERGE_TARGET_TILE = 2048`, `TargetReached`,
  `MergeState.targetReached`, geometry-agnostic short-circuit `hasValidMove`
  in `MergeRules.evaluateEnd`, `targetTile` option in `startMergeGame`, and 7
  new tests (`merge-game.test.ts` and `merge-rules.test.ts`).
- **Team modifications:** In gate 1, the owner checked whether running
  `evaluateEnd` on every move (returning `null` on most turns) was a design
  smell; the check confirmed it matches `BaseGameRules`'s contract across all
  four variants and that `hasValidMove` short-circuits on the first available
  move without cloning the board, only scanning every cell when the board is
  full.
- **Lessons / limitations:** The first draft of the HU28 tests expected
  `outcome` on `MoveResult` instead of `game.outcome`, missed calling
  `game.resolutionDone()` before checking `PlayingState` (D-22 `ResolvingState`
  lock), and placed an initial `2048` tile in the "emit only once" test (which
  correctly initialized `targetReached = true`). All three were fixed before
  committing.

### 2026-11-27 — Hexa Merge single undo (issue #78)

- **Tool / model:** Antigravity (Gemini 4 Neon).
- **Issue / PR:** #78.
- **Prompt (paraphrase):** Plan and implement #78 (HU27, RN-31) through the
  four-gate harness: enable one level of undo in Hexa Merge restoring board,
  score, `targetReached` and the seeded random generator state, while keeping
  the undo allowance configurable as data.
- **Result:** `DEFAULT_MERGE_UNDO_ALLOWANCE = 1` and `undoAllowance?: number`
  in `MergeGameOptions`, `CommandHistory` wired in `startMergeGame` with
  `allowRedo: false`, and 6 new tests in `merge-game.test.ts`.
- **Team modifications:** The AI first proposed injecting a `CommandHistory`
  object via `MergeGameOptions.history`. The owner checked whether the number
  of undos should stay configurable as plain data (consistent with
  `boardRadius`, `initialTileCount`, `spawnWeights` and `targetTile`), and
  chose `undoAllowance?: number` with `DEFAULT_MERGE_UNDO_ALLOWANCE = 1`.
- **Lessons / limitations:** Because `#58` (`CommandHistory`), `#111`
  (`Snapshot<IRandomSource>` in `SourcedGameRules`) and `#79`
  (`MergeState.targetReached` and `FinishedState` defeat) were already in
  place, enabling undo in Hexa Merge required zero changes to the generic
  engine or `MergeRules`.

### 2026-11-25 — Generic Lines game rules over TCoord (issue #165)

- **Tool / model:** Antigravity (Gemini 4 Neon), cross-reviewed by Codex.
- **Issue / PR:** #165.
- **Prompt:** Parameterize `LinesGameRules`, `PlacePieceMove`, and
  `LinesGameState` over `TCoord extends ICoord` and `IPieceSource`, leaving
  `HexCoord`/`HexGeometry` in `createLinesGame`, and prove geometry
  independence with a non-hexagonal board test.
- **Result:** Exported generic `LinesGameRules<TCoord, TSource>`,
  `LinesGameState<TCoord, TSource>`, and `PlacePieceMove<TCoord>` with
  hexagonal defaults so existing callers remain unchanged, removed the
  `HexBoard` import from rules, and added a non-hexagonal board test verifying
  placement, line clearing, typed `LineCleared` events, scoring and tray refill.
- **Team modifications:** Follow-up requested on #165 after #188 merged.
- **Lessons / limitations:** Default type parameters preserve backwards
  compatibility with open Lines/Fit UI branches while allowing arbitrary
  `IBoardGeometry<TCoord>` boards without engine changes.

### 2026-11-25 — Navigation flow test and level-selection route (issue #97)

- **Tool / model:** Antigravity (Gemini 4 Neon).
- **Issue / PR:** #97 (completes #90 navigation integration and #99 admin README note).
- **Prompt:** Connect `LevelSelectionView` into `RootNavigator` for
  level-based variants driven by `MENU_VARIANTS` configuration and add
  end-to-end navigation flow tests covering Home → level → game → result.
- **Result:** Added `LevelSelection` route, `LevelSelectionScreen` container
  with loading/error/retry states, `showStars` declarative config on
  `MENU_VARIANTS`, injectable `loadLevels` in `createAppServices`, visual
  polish in `LevelSelectionView`, four full navigation flow tests in
  `navigation-flow.test.tsx`, and the root `npm install` note in `README.md`.
- **Team modifications:** Kept `variantComponent` injectable on
  `RootNavigator` so end-to-end flows test real React Navigation transitions
  before every variant screen merges to `main`.
- **Lessons / limitations:** Tested with `@testing-library/react-native`;
  on-device gesture transitions remain part of physical Android QA.

### 2026-11-23 — Hexa Lines playable screen

- **Tool / model:** Codex.
- **Issue / PR:** #37 / screen draft #179 (integrates work from #33, #34 and #35).
- **Prompt:** Connect the existing Lines engine, preview and projection into
  a playable screen and verify the route from menu to result. Port the draft
  to #146's asynchronous command contract.
- **Result:** Added the presenter, the native board and tray, tap and drag
  input, and the finish-game integration. The compatibility pass unwraps
  successful results before navigation, handles controlled failures inline,
  and retains the result with a warning if the record cannot be saved.
  The finish command logs the game, outcome and save status.
- **Team modifications:** The reviewer requested typed previews and a
  logging aspect with an explicit allowlist.
- **Lessons / limitations:** Navigation and a seeded finishing move were
  tested with the React Native test renderer, including both Either branches
  and the save warning. Device drag remains a separate check. Records use the
  in-memory adapter pending #40.

### 2026-11-24 — Hexa Fit mobile screen

- **Tool / model:** Codex.
- **Issue / PR:** #87.
- **Prompt:** Connect the Fit screen to the generic rules and domain scoring.
- **Result:** Wired the offline session, board and tray, edit controls and
  clock into the native navigation and shared finish-game command.
- **Team modifications:** The #155 review requested Either handling, logging,
  domain scoring, generic coordinates and a configurable piece palette.
- **Lessons / limitations:** Before the route was wired, four navigation
  tests failed because Fit still opened a placeholder. Expo exported an
  Android bundle, but native touch and restart persistence remain unverified.

### 2026-11-24 — Seed settings use cases

- **Tool / model:** Codex.
- **Issue / PR:** #76 (application layer).
- **Prompt:** Validate seed changes using the documented game and level scopes.
- **Result:** Added the read and save commands behind an admin seed port.
  Validation rejects an empty Sort level or a seed outside the proposed
  unsigned 32-bit range, and preserves the server's forbidden response.
- **Team modifications:** None recorded.
- **Lessons / limitations:** The tests use an in-process port. Configured
  seeds on real devices require the backend endpoint and client wiring.

### 2026-11-24 — Admin seed settings HTTP and panel

- **Tool / model:** Codex.
- **Issue / PR:** #76 (panel and HTTP adapter).
- **Prompt:** Read and edit the published seed configuration through the
  admin endpoint contract.
- **Result:** Added the variant and level form, fixed and random modes,
  response parsing and permission feedback.
- **Team modifications:** None recorded.
- **Lessons / limitations:** Edge verified 403 and a level-scoped fixed
  seed update with simulated API replies. The deployed endpoint and the
  next-game effect are pending backend #28.

### 2026-11-27 — Remove instanceof from production code (issue #172)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #172.
- **Prompt (paraphrase):** plan #172 again from `main` through the harness
  (an earlier uncommitted attempt existed in the working tree), remove every
  `instanceof` from production code and the temporary ESLint exceptions.
- **Result:** `UnexpectedError` in `src/application/common/` used by both
  exception-handling aspects, `LoadLevelsUseCase` and
  `LoadProgressSummaryUseCase`; `String(error)` in the logging aspect's throw
  path and in `FinishGameUseCase`; `SessionState.outcome` with a `FinishedState`
  override so `GameEngine.outcome` delegates; `deliver()` rethrowing the
  original listener error; `HexCoord.equals(other: HexCoord)`; the #172 block
  removed from `eslint.config.mjs` and the legacy note from `AGENTS.md` §3;
  7 new tests and 10 updated assertions (`547 / 547` app, `28 / 28` panel).
- **Team modifications:** the owner had the earlier attempt saved as a patch
  and the task replanned from `main` instead of reusing it. When the planned
  `String(error)` changed the logged text of `Either.left` failures, he chose
  to keep `outcome.value.message` there, since the left value is already typed
  `Error`, and to use `String(error)` only for thrown `unknown` values. He
  checked that this rule still holds once #214 drops the `TError` generic.
- **Lessons / limitations:** `String(error)` on an `Error` adds its type
  (`"Error: disk full"`), which changed logged text and needed a decision;
  unexpected failures now carry that prefix and expected ones do not. The
  first commit header was rejected by commitlint (`application` is not a
  scope; header over 72 characters) and was fixed to `usecases`. Mutation
  checks: dropping `cause`, the `FinishedState` override, the original-error
  rethrow or the `HexCoord` parameter type each made a test or `tsc` fail.

### 2026-11-28 — Align CommandService with Either<Error, TResult> (issue #214)

- **Tool / model:** Claude Code (claude-opus-5-5).
- **Issue / PR:** #214.
- **Prompt (paraphrase):** explain why `CommandService` had three generics,
  trace where `TError` came from, then align the contract with the class
  pattern `Either<Error, TResult>` through the harness, keeping the name and
  without a `QueryService`.
- **Result:** the history showed `TError` came from the #146 issue text, not
  from class. `CommandService<TCommand, TResult = void>` and its async
  counterpart now return `Either<Error, TResult>`; the logging and
  exception-handling aspects lost `TError`; `LoadSeedConfigsUseCase` and
  `SaveSeedConfigUseCase` declare `SeedSettingsError` in their own `execute`;
  the panel's `SeedSettingsServices` uses two generics; `AGENTS.md` §4 and
  `docs/architecture.md` §2, §6 and D-23 updated; 2 new type tests
  (`555 / 555` app, `28 / 28` panel).
- **Team modifications:** the owner decided to follow the class pattern and
  checked with the AI that `TResult` already covers queries, so the name
  `CommandService` stays and no `QueryService` is added. When #76 started
  using `TError` the same day, he reviewed that new use and decided to go
  ahead, after the AI showed with `tsc` that a narrower return type keeps the
  error `code` on the concrete class. He also had #172 finished first,
  because it touched the same aspects.
- **Lessons / limitations:** an issue's text can introduce design that no
  decision records; tracing it through the issue, commit and `AI_USAGE.md`
  history settled it. Existing tests checked `code` with `toMatchObject`,
  which `tsc` does not check, so a typed test was added to protect the
  narrower return. Planned commits were merged into one because splitting
  the panel file would have left a commit that fails the panel type-check.
  One full-suite failure was seen once and never reproduced in 12 later
  runs; its name was not captured, so later runs use `--json`.

## 3. Critical evaluation

To be completed at the end of the project.

- **Approximate percentage of AI-assisted code:**
- **Cases where the AI was wrong or suboptimal, and how they were detected:**
- **Impact on productivity and quality:**
