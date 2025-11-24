# Contributing to LuxLab

Thanks for helping build LuxLab! This guide keeps changes consistent and easy to review.

## Workflow
- Create a feature branch from `main` (e.g., `feature/ies-upload`).
- Keep commits scoped and descriptive.
- Open a pull request with a short summary of changes, testing performed, and any open questions.

## Coding standards
- React + TypeScript with functional components and hooks.
- Keep UI components small, composable, and presentational; isolate business logic in `src/lib`.
- Prefer composition over inheritance; favor simple data structures and pure functions.
- Follow ESLint/Prettier defaults in this repo (`npm run lint`, `npm run format`).
- Write or update TypeScript types for new data structures.

## Testing
- Unit tests with Vitest live in `tests/`.
- Add tests for new utilities (e.g., parsers, calculations) and significant UI behaviors.
- Run `npm run test` and `npm run lint` before opening a PR.

## Documentation
- Update README sections and inline TSDoc when adding new features.
- Note any assumptions or limitations in code comments near the logic that enforces them.

## CI/CD
- GitHub Actions will run build and tests on PRs and pushes to `main`.
- Fix lint/test failures before requesting review.
