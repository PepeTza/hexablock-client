# AGENTS.md

Rules for any AI coding agent (Claude Code, Codex, Copilot agent, etc.)
working in this repository. Humans should read it too: it describes how we
work with agents.

## 1. Project context

HexaBlock Suite is a semester project: four hex-board puzzle games
(Hexa Lines, Hexa Fit, Hexa Sort, Hexa Merge) built on **one generic engine**,
with a NestJS backend and an admin web panel.

- Client repo: https://github.com/PepeTza/hexablock-client
- Backend repo: https://github.com/PepeTza/hexablock-backend

What is evaluated is not only that the games work, but that the design applies
generic programming, SOLID, Clean Architecture, GoF patterns and AOP, and
that **the team can explain every line**. Optimise for clarity and
explainability over cleverness.

### This repository: client

- React Native + TypeScript app: generic engine, the four variants, use
  cases, UI, local storage and HTTP adapters.
- The admin web panel (`admin/`), which uses the same domain and application
  code to build, validate and publish levels and configure seeds through the
  API.
- Game and domain docs live here in [`docs/`](./docs/README.md) (glossary,
  requirements, business rules, use cases, user stories, domain model,
  architecture). They are being translated from the team's technical document;
  until a document exists, ask instead of assuming.
- The API contract lives in the backend repo:
  [`docs/api-contracts.md`](https://github.com/PepeTza/hexablock-backend/blob/main/docs/api-contracts.md).
  The client adapts to it; it never changes it.
- Gameplay must work offline. Network calls are best-effort and must never
  block or break a game.
- Commands (run from the repository root, Node 22.13 or newer):
  - `npm install`: installs dependencies and activates the git hooks.
  - `npm start` / `npm run android`: run the app with Expo.
  - `npm run lint`: ESLint, no warnings allowed.
  - `npm run format:check` / `npm run format`: check or apply Prettier.
  - `npm run typecheck`: TypeScript in strict mode, no emit.
  - `npm test` / `npm run test:coverage`: Jest; coverage must stay at 80 % or
    more in `src/domain` and `src/application` once those folders exist.
- Admin panel commands (run from `admin/`, which has its own `package.json`):
  - `npm install`: installs the panel's dependencies.
  - `npm run dev` / `npm run build` / `npm run preview`: serve, build or serve
    the built panel with Vite.
  - `npm test`: Vitest. `npm run lint`: ESLint with the panel's import
    boundary (only `@domain` and `@application`, D-19). `npm run typecheck`:
    strict TypeScript.
  - The root type-check and Jest ignore `admin/`; the pre-commit hook lints
    panel files with the panel's own ESLint config.

## 2. Workflow: the harness

Every task follows [`harness/`](./harness/README.md). In short:

1. **Plan first.** Before writing code, read the relevant docs and files,
   then answer with the current state, the plan file by file, the design and
   any new concepts explained, the test cases, what is out of scope and your
   confidence. Say whether the task differs from
   `docs/implementation-plan.md` or a recorded decision, and how. **Stop and
   wait for approval.**
2. **Build** only what was approved. If the plan has to change, stop and ask.
3. **Commit** only after the human approves the diff and the message.
   Current mode: **approval per commit**. The team may later switch to
   approval per push by editing this line.
4. **Done:** run the checklist, run the `code-rules-review` and
   `architecture-review` skills on your branch and fix or explain each
   finding, update `harness/phase-log.md`, add an `AI_USAGE.md` entry if
   significant, and write a short "How it works" summary for the PR. List
   what you did on your own (see §3, "You may do and report").

## 3. What you may do, what you must ask, what you must never do

### Decisions: you recommend, the human decides

You never take a decision that has real alternatives: design, behaviour, the
API contract, interpreting a rule, the outcome of a review. Present it
instead:

- two or three options, each with a one-line pro and con;
- the one you recommend, marked;
- **one decision at a time**, so the human can understand each one.

The human decides. A decision that affects the design or the plan is then
written back as `CONTRIBUTING.md` §3 says.

### You may do and report

Mechanical work with no real alternative. Do it, then list it in your summary
so the human sees it:

- Names and structure of private helpers inside the files of the task.
- Small refactors inside the files you are already changing for the task,
  as long as they do not change behaviour. Mention them in the PR.
- Adding tests, fixing lint and type errors you introduced.

### You must ask first

- Anything that changes a documented decision: architecture, layers, patterns,
  generic type parameters and their constraints, public interfaces of the
  domain. When a task takes, changes or contradicts a decision or a part of
  the plan, the same PR updates `docs/implementation-plan.md` §7 and
  `docs/architecture.md` §10 (in the client repository).
- Adding, removing or upgrading a dependency.
- Changing the API contract (`docs/api-contracts.md`) or the database schema.
- Interpreting or deviating from a business rule (RN-xx) or a use case
  (CU-xx), or when two documents disagree.
- Work outside the scope of the task, including "while I was here" fixes.
- Deleting or weakening existing tests.

### You must never

- Commit or push without explicit approval; push to `main`; force-push
  (except `--force-with-lease` on your own task branch when asked).
- Bypass hooks (`--no-verify`) or disable, skip or delete tests to make CI pass.
- Modify Git remotes, branch protection or repository settings.
- Commit secrets, `.env` files, tokens or build artifacts.
- Modify the other repository from this one. If the contract between them must
  change, stop and report it.
- Use `any`, `@ts-ignore` or `eslint-disable` to silence an error without the
  human's approval and a comment explaining why.
- Use type assertions / casts (`as SomeType`, `<SomeType>value`) in production
  code to presuppose a concrete subtype or silence `noUncheckedIndexedAccess`;
  use generics, type guards or narrowing (`typeof`, `instanceof`, explicit
  `undefined` checks).
- Put business rules in UI components, screens or HTTP controllers.

## 4. Code rules (summary)

The full rules are in [`CONTRIBUTING.md`](./CONTRIBUTING.md).

- TypeScript strict. English for code, comments and docs. Use the terms of the
  [glossary](https://github.com/PepeTza/hexablock-client/blob/main/docs/glossary.md).
- Dependency rule: inner layers never import outer ones. The domain has no
  framework, UI, storage or network imports.
- Application use cases and AOP (`src/application/`): every use case
  implements `CommandService<TCommand, TResult, TError>` (or
  `AsyncCommandService`), returning `Either<TError, TResult>` instead of
  throwing domain or validation errors (Mark Seemann, *Dependency Injection
  Principles, Practices, and Patterns*, Ch. 10). Cross-cutting aspects
  (`<<aspect>>`: logging, exception handling, authorization, retry, cache) are
  Decorators implementing the same interface and wrapping
  `decorate: CommandService<...>` without type casts.
- Design for change (`CONTRIBUTING.md` §4): never assume a requirement will
  not change. Values from the game rules or the statement (board size and
  shape, limits, counts, formulas) are data, not scattered constants.
- Randomness always goes through an injected, seedable random source, so
  tests are deterministic.
- Tests: `should_<result>_when_<condition>`, Arrange / Act / Assert. You
  propose the test cases in the plan, with one plain-language line per case
  saying what it protects; the team approves the list before you write them.
- When you introduce a pattern, name it in the class doc comment
  (e.g. `/** Strategy: ... */`) so it can be found and explained.
- When you use a non-trivial algorithm or an external source, cite it in a
  comment or in the docs.

## 5. Commits and AI traceability

- Conventional Commits in English, with the scopes in `CONTRIBUTING.md` §2.
- Every commit with AI-generated content carries the footer
  `AI-Assisted: <tool> (<model>)`.
- Corrections a human makes to that output go in a **separate commit**
  without the footer.
- Small, frequent commits: one logical change each.

## 6. Communication with the team

- The team may talk to you in Spanish; everything written to the repository
  is in English.
- Explain concepts the first time they appear, briefly and in plain language.
- If you are unsure, say so and ask. Do not guess requirements.

## 7. Skills

Step-by-step guides for repetitive tasks, in `.claude/skills/<name>/SKILL.md`.
Claude Code loads them automatically; any other agent must read the one that
fits the task before starting. They add detail to these rules; they never
override them.

| Skill | Use it when |
|---|---|
| [`harness-task`](./.claude/skills/harness-task/SKILL.md) | Starting any task from its issue (gate 1) |
| [`aaa-test`](./.claude/skills/aaa-test/SKILL.md) | Proposing or writing any test |
| [`add-variant`](./.claude/skills/add-variant/SKILL.md) | Building a variant or rehearsing "add a fifth variant" |
| [`design-level`](./.claude/skills/design-level/SKILL.md) | Designing or checking a Hexa Fit or Hexa Sort level |
| [`log-ai-usage`](./.claude/skills/log-ai-usage/SKILL.md) | Gate 4, before opening the pull request |
| [`code-rules-review`](./.claude/skills/code-rules-review/SKILL.md) | Gate 4 on your own branch, and reviewing a pull request: code rules |
| [`architecture-review`](./.claude/skills/architecture-review/SKILL.md) | Gate 4 on your own branch, and reviewing a pull request: architecture |
| [`pr-review`](./.claude/skills/pr-review/SKILL.md) | Reviewing a teammate's pull request: the whole PR and the review comment |

`harness-task`, `aaa-test`, `log-ai-usage`, `code-rules-review`,
`architecture-review` and `pr-review` are shared with the backend repository:
whoever changes one updates the other copy the same day.

Claude Code also has a read-only subagent for each reviewer skill
(`code-rules-review`, `architecture-review`, `pr-review`, in
[`.claude/agents/`](./.claude/agents/)), which runs it on a plan or a diff
with fresh eyes. Other agents read the skill and apply it themselves.
