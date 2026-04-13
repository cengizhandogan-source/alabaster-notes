Commit all current changes, push to main, and rebuild the Electron DMG.

Steps:
1. Run `git status` and `git diff` to review what changed.
2. Stage the relevant changed files (do NOT use `git add -A` — add files by name).
3. Create a commit with a concise message describing the changes.
4. Push to the `main` branch.
5. Run `npm run electron:build` to rebuild the DMG.
6. Report the path to the new DMG when done.
