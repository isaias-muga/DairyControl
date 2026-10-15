import { expect, request, type FullConfig } from '@playwright/test';

// Waits until GET /health answers 200 (API up, migrations applied, database reachable).
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL!;
  const api = await request.newContext({ baseURL });

  await expect
    .poll(
      async () => {
        try {
          return (await api.get('/health', { timeout: 15_000 })).status();
        } catch {
          return 0; // connection refused while the containers start
        }
      },
      { message: `${baseURL}/health never answered 200`, timeout: 180_000, intervals: [1_000, 2_000, 5_000] },
    )
    .toBe(200);

  await api.dispose();
}
