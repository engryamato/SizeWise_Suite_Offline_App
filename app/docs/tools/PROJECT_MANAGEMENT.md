# Project Management Workflows

📦 Phase 0.0 – Project Management Setup

## Workflows

1. **Requirement Intake** – Capture feature requests in the project planner with phase tags and scope summaries.
2. **Planning** – Break features into isolated, testable tasks. Map dependencies using `/app/core/` modules and shared schemas.
3. **Development** – Implement code in feature-specific branches with unit tests. Validate all JSON with AJV/Zod before commits.
4. **Review** – Run `npm test` for ≥85% coverage and conduct peer review on pull requests.
5. **Release** – Merge into `main` with semantic commit messages and update changelog entries.

## API Usage

The project management API exposes REST endpoints under `/services/project-api`:

- `POST /projects` – create a new project. Accepts `{ name, phase, owner }` and returns `201` with project metadata.
- `GET /projects/:id` – retrieve project status, including pending tasks and coverage metrics.
- `PATCH /projects/:id` – update phase tags or rollback states. Returns updated record.

Clients should authenticate with JWT tokens stored by `/services/storage` and reuse shared validators from `/app/core/validators`.

## Rollback Steps

1. Tag the last known good commit: `git tag -a rollback-prep -m "pre-change snapshot"`.
2. Revert the problematic commit: `git revert <hash>`.
3. Run `npm test` to confirm stability.
4. Document the rollback in the changelog and push tags for traceability.

## References

- [API Documentation](../api/)
- [Root README](../../README.md)

## Changelog

- `0.1.0` – initial project management workflow documentation.

