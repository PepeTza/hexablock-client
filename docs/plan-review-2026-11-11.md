# Plan and documentation review (2026-11-11)

Review of `docs/implementation-plan.md` against the documents and the current
state of both repositories. It lists what disagrees, what is missing and what
should change, so the team can decide. Nothing here has been applied.

What was reviewed:

- Client `main` (`8e06f16`) and backend `main` (`d653786`): every file in
  `docs/`, `harness/`, `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`,
  `CONTRIBUTING.md`, `README.md`, `AI_USAGE.md` and the tooling config of the
  Expo app.
- Open pull requests: client
  [#16](https://github.com/PepeTza/hexablock-client/pull/16) (decisions
  D-06, D-07, D-10, D-17–D-20),
  [#17](https://github.com/PepeTza/hexablock-client/pull/17) (agent skills)
  and backend [#9](https://github.com/PepeTza/hexablock-backend/pull/9)
  (CONTRIBUTING alignment).
- The I0 issues (client #3–#12, backend #3–#8).
- `npm run lint`, `npm run typecheck` and `npm test` on the client: all pass
  (1 / 1 test).

Severity: **High** = blocks a merge or breaks a documented rule; **Medium** =
the plan or a document is wrong and will mislead a task; **Low** = cosmetic
or easy to fix later.

## 1. Summary

| # | Finding | Severity | Where to change |
|---|---|---|---|
| 1 | The two open client PRs delete work already on `main` (phase-log row and `AI_USAGE.md` entry of the Expo setup) | High | PRs #16 and #17 |
| 2 | Commits on `main` and in open PRs are authored by `Claude <noreply@anthropic.com>`, not by a team member | High | Cloud session git identity; PRs #16, #17, backend #9 |
| 3 | Four different formats of the `AI-Assisted` footer in the history; three documents disagree on the format | High | `CLAUDE.md`, `AGENTS.md` §5, `CONTRIBUTING.md` §2, `log-ai-usage` skill |
| 4 | D-06: the plan recommends AsyncStorage; PR #16 records SQLite. The dependency table follows the plan | Medium | `implementation-plan.md` §5 and §7, `architecture.md` D-06 |
| 5 | The plan still lists as pending decisions already taken in PR #16 and backend #9; §8 items 1 and 3 are resolved | Medium | `implementation-plan.md` §7 and §8 |
| 6 | The admin panel cannot reach the use cases CU-17, CU-18 and CU-11 under the lint rule of plan §4 | Medium | `implementation-plan.md` §4, `use-cases.md`, D-19 |
| 7 | The client tooling is not ready for `admin/` (tsconfig, Jest, ESLint, aliases) | Medium | Issue #7 (T05) acceptance criteria |
| 8 | `stars` in `PlayerProgress`: the contract says 1–3 for both level games; the data model and RN-25 say Sort has no stars | Medium | Backend `api-contracts.md` §4 |
| 9 | Username, password and rate-limit rules are "proposed" in the contract but the plan treats them as decided | Medium | `api-contracts.md` §1, §3, §9 or plan §7 |
| 10 | `architecture.md` says it is shared by both repos; the backend has no copy and plans one | Medium | Backend `docs/README.md`, `architecture.md` intro |
| 11 | State pattern: planned as "possible over-engineering" but CU-06 and `architecture.md` §4 depend on it | Medium | Decide before HU08; `use-cases.md` CU-06 |
| 12 | Issue count "83 in total" does not count the eight `cl+be` twin tasks (91) nor backend #8 | Low | `implementation-plan.md` §3 |
| 13 | HU07 acceptance in I0 ("instantiated with 4 cell types") cannot be met in I0 | Low | `implementation-plan.md` §3, issue #10 |
| 14 | Plan §4 lint table: the composition-root exception is on the wrong row | Low | `implementation-plan.md` §4 |
| 15 | Ports are named in five places with no single list | Low | `architecture.md` §2 |
| 16 | JSON vs JSON/YAML still in three documents | Low | `requirements.md` RF-13, `architecture.md` §4 and ADR-07 |
| 17 | Client README still says "pre-implementation" | Low | `README.md` |
| 18 | Backend lacks `.gitattributes` and `.vscode/extensions.json` | Low | Issue #4 (T09) |
| 19 | Client `.gitignore` only partially ignores `android/` and `ios/` | Low | `.gitignore` |
| 20 | `CONTRIBUTING.md` §3 shows an outdated PR template | Low | `CONTRIBUTING.md` §3 |
| 21 | Broken link to `docs/diagrams/` | Low | `EXTENSIBILITY.md`, `docs/README.md` |
| 22 | Owner column of the phase log: real names vs GitHub user | Low | `log-ai-usage` skill §2 |
| 23 | No written list of the files kept identical in both repositories | Low | `CONTRIBUTING.md` §9 or `AGENTS.md` |

## 2. Open pull requests (fix before merging)

### 2.1 PRs #16 and #17 delete work on `main`

Both branches were merged with `main` (commit "Merge branch 'main' into …")
and the conflict in `harness/phase-log.md` was resolved by **replacing** the
row of the Expo setup (#5, Jesus Obando) with the new row. PR #17 does the
same in `AI_USAGE.md`: the whole "2026-11-10 — Expo app setup" entry
disappears and the skills entry takes its place.

Verified with `git diff origin/main origin/<branch> -- harness/phase-log.md
AI_USAGE.md` on both branches.

Proposed change:

- Rebase both branches on `main` (not merge), keep both rows and both
  entries, and `git push --force-with-lease` on the task branch
  (`AGENTS.md` §3 allows it when asked).
- The merge commits also break the "require linear history" rule of
  `CONTRIBUTING.md` §1 and the "each commit must be clean" rule of §3; the
  rebase removes them.
- Backend #9 is fine (no merge commit, no deleted content).

### 2.2 Commits authored by "Claude"

Author `Claude <noreply@anthropic.com>` appears on client `main` (`9e9240a`,
`5eb018e`), on backend `main` (`c606c3e`, `5e469ba`, `d653786`), and on every
commit of PRs #16 and backend #9. `CONTRIBUTING.md` §9 says the human who
launches the agent is the author, and the rebase-and-merge strategy exists
precisely so the history shows individual participation. These commits count
for nobody.

Proposed change:

- Set the git identity of the cloud sessions (Claude Code on the web) to the
  team member's name and e-mail before committing. Commits already on
  `main` cannot be rewritten (protected branch); record the case in
  `AI_USAGE.md` instead.
- For PRs #16 and backend #9, reset the author
  (`git rebase -i` with `--reset-author`, or `git commit --amend
  --reset-author` per commit) before merging.
- Add a check to `harness/checklists.md` gate 3: "the commit author is the
  team member, not the tool".

### 2.3 Footer format

Formats found in the history:

| Footer | Where |
|---|---|
| `AI-Assisted: Claude Code (Claude Opus 5.5)` | Plan, skills (both repos) |
| `AI-Assisted: Claude Code (claude-fable-5-2)` | Client `79a24c2` |
| `AI-Assisted: Claude Code` (no model) | Client `50886b9`–`8e06f16`, agreed in the #5 session per `AI_USAGE.md` |
| `AI-Assisted: Claude (claude-opus-5-5)` | Backend `a333101`, and the example in `CONTRIBUTING.md` §2 |

The documents disagree too: `CLAUDE.md` says `Claude Code (<model id>)`,
`AGENTS.md` §5 says `<tool> (<model>)`, `CONTRIBUTING.md` §2 shows
`Claude (claude-opus-5-5)` and the `log-ai-usage` skill shows
`Claude Code (Claude Opus 5.5)`.

Proposed change: pick one format, for example
`AI-Assisted: Claude Code (claude-opus-5-5)` (tool as the product name,
model as its id), and apply it to the four documents in the same PR. Decide
whether the agreement of the #5 session (no model id) stands; if it does,
`CLAUDE.md` and `AGENTS.md` must say so. The `AI_USAGE.md` §1 row for Claude
Code says "to be recorded per entry", but the Expo entry has no model.

## 3. Plan versus decisions already taken

### 3.1 D-06 local storage (finding 4)

- Plan §7 decision 4 recommends **key-value JSON (AsyncStorage)**; the
  dependency table lists `@react-native-async-storage/async-storage` "(if
  D-06 = key-value)".
- PR #16 records D-06 as **SQLite, provisional**, with a question for the
  professor.
- HU29 (I1, Kenneth) depends on it, and `expo-sqlite` is not in the
  dependency table.

Proposed change: once the professor answers, update §5 (dependency table),
§7 (decision 4) and `architecture.md` §1 together. Until then, state in the
plan which one HU29 starts with.

### 3.2 Decisions table (finding 5)

After PR #16 and backend #9, decisions 1 (Expo, D-17), 2 (Vite, D-18), 3
(alias, D-19), 5 (React Navigation, D-20), 6 (Render, D-10), 7 (catalog,
D-07), 17 (`panel` label) and 18 (`-be` suffix) are taken, and §8 items 1
(CONTRIBUTING) and 3 (Skia "in iteration 2") are resolved. The plan still
presents all of them as open.

Proposed change: add a **Status** column to §7 ("decided, see D-xx" with the
date) and to §8, so the plan stays the single place to see what is still
open. Note that T02 (#4) was scoped to D-06, D-07 and D-10; PR #16 also
records D-17–D-20 and changes `CONTRIBUTING.md`, which is wider than its
issue (`AGENTS.md` §3: work outside the scope needs asking).

### 3.3 Admin panel and the use cases (finding 6)

- `use-cases.md` defines CU-17 `CreateLevelUseCase` and CU-18
  `ConfigureSeedUseCase` as use cases, and CU-11 A4 says the administrator
  logs in "through this same use case" (`LoginUseCase`).
- Use cases live in `src/application/use-cases/` (plan §4).
- The lint rule of plan §4 says `admin/**` may import **nothing outside
  `src/domain`**, and D-19 (PR #16) repeats it.

So the panel cannot use CU-17, CU-18 or CU-11 as documented. Options:

1. Allow `admin/**` to import `src/application` too, and let the panel
   provide its own adapters (HTTP client, browser storage for drafts) for the
   ports. The dependency rule still holds: the panel is an outer layer.
2. Keep the rule and move the panel's use cases into `admin/src/application`,
   marking CU-17 and CU-18 in `use-cases.md` as panel-local.

Either way, update plan §4 (lint table and folder structure), D-19 and the
"Design note (CU-17 and CU-18)" in `use-cases.md`.

### 3.4 Client tooling before `admin/` exists (finding 7)

Issue #7 (T05) adds `admin/` with Vite and Vitest. The current root config
would break or misbehave:

| File | Today | Needed |
|---|---|---|
| `tsconfig.json` | No `exclude`; `extends expo/tsconfig.base` includes everything | `exclude: ["admin"]`, or `npm run typecheck` compiles the panel with React Native types |
| `tsconfig.json` | No `paths` | `baseUrl` + `paths` for `@domain/*` (and `@application/*` if 3.3 chooses option 1); Metro or Babel resolution for the app and `moduleNameMapper` for Jest |
| `jest.config.js` | `preset: jest-expo`, no `testPathIgnorePatterns` | Ignore `admin/` (or `roots: ['<rootDir>/src']`), or Jest runs the Vitest files with the Expo preset |
| `eslint.config.mjs` | Ignores `admin/` entirely | The `admin/**` boundary rule of plan §4 needs a place to run: a block in the root config or `admin/eslint.config.mjs` run by the `admin` CI job |
| `.prettierignore` | Does not ignore `admin/dist` | Add it |

Proposed change: add these five points to the acceptance criteria of #7
(T05) and #8 (T06), so the two owners do not discover them in the same week.

### 3.5 Smaller plan corrections (findings 12, 13, 14)

- **Issue count:** HU01–HU35 (35) + T01–T43 (43) + five `-be` stories = 83,
  but the plan also says that `cl+be` tasks get one issue in each repository
  (T01, T06, T11, T19, T34, T39, T40, T41 = 8 more), so 91. Backend #8
  (CONTRIBUTING alignment) exists without a row in §3. `AI_USAGE.md` already
  notes that counts from the AI must be checked; this is one.
- **HU07 in I0:** "instantiated with 4 cell types" needs `Color`, `PieceId`,
  `ColorStack` and `Tile`, which arrive with the variants in I1–I3. Reword to
  "instantiated with at least two test cell types; each variant later adds
  its own", and keep the three board shapes.
- **Lint table:** "`adapters/**` cannot import `frameworks` (except the
  composition root)". The composition root is `frameworks/composition-root.ts`,
  which may import anything; the exception belongs to no row. Remove it, or
  say "the composition root is the only file in `frameworks/` that imports
  `adapters/`".
- **External packages in `domain/**`:** `no-restricted-imports` has no
  "every external package" option; it needs a pattern such as
  `['*', '!./**', '!../**', '!@domain/**']` or an explicit list. T06 (#8)
  already requires a fixture; make sure the fixture covers an external
  import, not only a layer import.
- **Swagger** appears in T09 (I0, "Swagger at `/api/docs`") and in T17 (I1,
  "… and Swagger"). Say which is setup and which is the per-endpoint
  decorators.

## 4. Contract and documentation inconsistencies not yet in plan §8

### 4.1 `stars` for Hexa Sort (finding 8)

`api-contracts.md` §4: "Level games (`hexa-fit`, `hexa-sort`) … `stars` is
1–3". `data-model.md` `level_progress.stars`: "Fit only; `null` in Sort".
RN-25: "Hexa Sort does not use stars". The contract must say that `stars` is
`null` (or absent) for `hexa-sort`, and the merge rule of `PUT /progress`
must ignore it there. Also affects HU31-be and the client's
`LevelProgress` model.

### 4.2 Proposed values treated as decided (finding 9)

`api-contracts.md` marks as *(proposed)* or open (§9): username 3–20,
password 8–72, the rate limits and the plausibility thresholds. The plan's
acceptance criteria use them as facts: HU30-be ("bcrypt; 90 days; generic
401; 409; 429"), T26 and the `bcrypt` row ("its 72-byte limit matches the
8–72 rule"). Either mark them decided in the contract (one commit, backend
repo, approval needed per `AGENTS.md`) or add them to plan §7 with a due
date before I1.

### 4.3 `architecture.md` ownership (finding 10)

Its introduction says "shared by both repositories; the copy in the client
repo is the reference". The backend has no copy and its `docs/README.md`
lists `architecture.md` as "Planned". A second copy would drift like the
skills do. Proposed: the backend links to the client's file (as it does for
the game docs) and removes the "Planned" row; the client file drops "the copy
in the client repo". The backend `docs/README.md` should also link
`implementation-plan.md`, since the backend issues cite it.

### 4.4 State pattern (finding 11)

Plan §7 lists `MenuState … VictoryState` as possible over-engineering, but
`use-cases.md` CU-06 ("State pattern: each game state is an object that
decides what it allows") and `architecture.md` §4 depend on it, and HU08
(I1, mob session) implements the engine. Decide before HU08 starts; if
dropped, rewrite the CU-06 design note (a `GameStatus` value plus checks in
the engine) and the §4 row.

### 4.5 Lists that disagree (findings 15, 16)

- **Ports:** `architecture.md` §2 names `IProgressRepository`,
  `ILevelRepository`, `IAuthService`; CU-07 adds `ISyncQueue`,
  `ISessionProvider`, `IEventBus`; plan §4 adds `ILogger`; `domain-model.md`
  adds `IUserRepository`, `ILeaderboardRepository`, `ISeedConfigRepository`.
  One table in `architecture.md` §2 (port, layer that implements it, used by
  which CU) avoids five partial lists. Likewise, §2 lists seven use cases
  while `use-cases.md` has eighteen; point to `use-cases.md` instead.
- **JSON / YAML:** plan §8 item 2 proposes JSON only. The files to touch are
  RF-13 ("JSON/YAML"), `architecture.md` §4 Builder row ("from JSON/YAML")
  and ADR-07 (already JSON).

### 4.6 Small document fixes (findings 17, 20, 21, 22)

- Client `README.md`: "Status: pre-implementation … Code starts in the next
  iteration" is outdated since PR #15; the badges comment waits for #6.
- `CONTRIBUTING.md` §3 reproduces a PR template without "How it works" and
  without the `phase-log.md` item; `.github/pull_request_template.md` has
  both. Replace the snippet with a link to the file.
- `EXTENSIBILITY.md` links `./diagrams`, which does not exist until T19.
  Create `docs/diagrams/README.md` ("planned, see T19") or mark the link.
- `log-ai-usage` §2 writes `<GitHub user>` in the Owner column; the phase
  log uses "PepeTza" and "Jesus Obando". Choose one (the plan uses names).
- `harness/phase-log.md` says "newest at the bottom", but the Expo row
  (11-10) sits below the plan row (11-11). Order by merge date, or drop the
  rule: every PR adds its row at the end and the order is whatever merges
  first.

## 5. Missing files and setup gaps

- **Client skills (finding 23 context):** `main` has no `.claude/skills/`;
  it arrives with PR #17. Backend `AGENTS.md` §7 already says the three
  shared skills "are shared with the client repository". Merge #17 after
  fixing 2.1.
- **Backend (finding 18):** no `.gitattributes` (the client needed one for
  Windows checkouts; the backend will hit the same problem) and no
  `.vscode/extensions.json` (plan §5.6 says both repos). Add both in T09
  (#4). `AGENTS.md` commands are pending by design.
- **Client `.gitignore` (finding 19):** ignores `android/app/build/`,
  `android/.gradle/` and `ios/Pods/` only. With D-17 (`expo prebuild` only in
  CI) the whole `/android` and `/ios` folders are generated and should be
  ignored, as ESLint already does.
- **CI:** no workflow in either repo yet (#6, #5 open). Expected in I0;
  listed so the "done when" of I0 ("CI green on a PR in both repos") is
  tracked.
- **Minor versions:** `@types/jest` is pinned to `30.0.0` while `jest` is
  `~30.5.2`; plan §5.1 asks for a pinned Expo SDK but `expo` is `~58.0.23`
  (patch range). Harmless; align when touching `package.json` next.

## 6. Shared files between repositories (finding 23)

Kept identical by hand today: `CONTRIBUTING.md`, `harness/README.md`,
`harness/checklists.md`, `harness/task-template.md`,
`.github/pull_request_template.md`, `.editorconfig` and the three shared
skills. Only the skills have the "same day" rule (`AGENTS.md` §7), and only
the skills say who updates the other copy. Proposed: one "Shared files" list
in `CONTRIBUTING.md` §9 with the rule, and a one-line check in gate 4
(`diff <file> ../hexablock-backend/<file>`) so a PR that changes one of them
names its twin PR, as PR #16 and backend #9 already do.

## 7. What is consistent (no change needed)

- The I0 issues match the plan's table and tracks (titles, labels,
  assignees), including the `panel` label on #7 and the `-be` convention.
- The three shared skills in PR #17 are byte-identical to the backend copies.
- The Expo setup on `main` matches plan §5 (strict + `noUncheckedIndexedAccess`,
  typescript-eslint type-checked, Prettier, Jest with the conditional 80 %
  threshold, husky + commitlint with the scope list of `CONTRIBUTING.md`,
  `.vscode/extensions.json`, commands in `AGENTS.md` and the README).
- `api-contracts.md`, `data-model.md` and the business rules agree on
  immutability of levels, seed config outside the level, idempotent progress
  merge and `sessionId` idempotency, apart from 4.1 and 4.2.
- The commit history of `main` in both repos is linear (PR #15 was flattened
  before merging, as `AI_USAGE.md` said it would be).
