# RUN THE E2E TESTS

## Commands

**Full suite:**
```bash
npm e2e              # Standard run (headless)
npm e2e:debug        # Rich logging (DEBUG=pw:api)
npm e2e:smoke        # Smoke tests only (@smoke tag)
```

**Single spec (replace `<spec>` with test file):**
```bash
npm e2e:debug -- <spec>                    # Headless, verbose
npm e2e:debug:headed -- <spec>             # Show browser
npm e2e:debug:protocol -- <spec>           # Full protocol logs
```

**Targeted:**
```bash
npm e2e:debug -- --grep "<pattern>"        # Match pattern
npm e2e:debug -- --grep-invert "<pattern>" # Exclude pattern
```

## Rules

**DO:**
- Default to headless; use headed only if user wants to "see" the test ("show me", "I want to see", "execute headed")
- Fix application code when tests fail
- Use `npm db:query "..."` to inspect/reset DB state

**DON'T:**
- Spin up a dev server (localhost:3000 already running)
- Open reports automatically (user does this manually)
- Use `PWDEBUG` or `page.pause()`
- Change tests to pass; only update if business logic changed

## Notes

- All commands auto-load `.env` and stop on first failure
- Test descriptions live in `tests/e2e/test-descriptions/` (keep updated)