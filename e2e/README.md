# E2E tests

Playwright tests that drive the real app through the Docker Compose stack. Every test creates its own proveedor and ticket, so tests do not depend on each other or on the demo seed.

```bash
# from the repo root (needs a .env, see .env.example)
docker compose up -d --build

cd e2e
npm ci
npx playwright install chromium
npm test            # waits for GET /health before starting
npm run report      # open the HTML report
```

- The admin password is read from `E2E_ADMIN_PASSWORD`, or from `ADMIN_PASSWORD` in `../.env`.
- `E2E_BASE_URL` overrides the target (default `http://localhost:8080`).
- Tests run with one worker because the quality limits are a single global row.
- Stop the stack with `docker compose down -v`.
