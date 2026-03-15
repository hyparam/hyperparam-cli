Update all npm dependencies to their latest versions.

## Steps

1. Run `npm outdated` to see what's behind.
2. Update `package.json` with the latest versions, **pinned** (no `^` or `~`).
3. Run `npm install` to update the lockfile.
4. Run `npx tsc`, `npm run lint`, and tests `npm test`.
5. If anything fails:
   - For **major version bumps**, research the changelog on GitHub (check the repo's CHANGELOG.md, releases page, or migration guide) to understand breaking changes.
   - Apply the necessary code fixes based on what you find.
   - Re-run tsc, lint, and tests until green.
6. Summarize what was updated and any breaking changes you resolved.
