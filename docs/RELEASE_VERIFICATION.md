# Release verification

Complete for every tagged release:

- Record the exact commit and confirm a clean worktree.
- Run `npm run check` on a supported Node version.
- Confirm the GitHub Actions Node 20/22/24 matrix passes on the exact commit.
- Review dependency status (the initial release intentionally has none).
- Verify dark and light themes at desktop and mobile widths.
- Exercise add/remove, dynamic fields, sample, invalid input, import, JSON/Markdown export, clear/undo, keyboard focus, and reduced motion.
- Confirm the production response uses the expected static files and no unexpected remote requests.
- Confirm documentation, privacy claims, screenshots/evidence, release tag, Pages deployment, and repository commit match.
- Obtain an independent review and resolve or explicitly document every finding.
