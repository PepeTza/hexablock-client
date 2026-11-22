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

## 3. Critical evaluation

To be completed at the end of the project.

- **Approximate percentage of AI-assisted code:**
- **Cases where the AI was wrong or suboptimal, and how they were detected:**
- **Impact on productivity and quality:**
