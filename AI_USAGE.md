# AI Usage

How the team uses generative AI in this repository, as required by section 7
of the project statement. The team is responsible for all delivered code,
whether or not it was AI-assisted, and must be able to explain any part of it.

## 1. Tools

| Tool | Model / version | Role in the workflow |
|---|---|---|
| Claude (claude.ai) | Claude Opus 5.5 | Requirements analysis, business rules, use cases, domain model, API contract, repository documentation. Consulted for design options; decisions are taken by the team. |
| Claude Code | To be recorded per entry | Implementation of approved tasks through the harness (`harness/`). Writes code and tests under human approval at each gate. |

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

## 3. Critical evaluation

To be completed at the end of the project.

- **Approximate percentage of AI-assisted code:**
- **Cases where the AI was wrong or suboptimal, and how they were detected:**
- **Impact on productivity and quality:**
