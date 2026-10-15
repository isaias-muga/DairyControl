import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Locally the Compose stack reads its secrets from ../.env; reuse it for the admin password.
if (existsSync('../.env')) {
  process.loadEnvFile('../.env');
}

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  // The quality limits are a single global row, so tests must not run in parallel.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    locale: 'es-AR',
    // The plant works in Buenos Aires time (Resumen ranges); the CI runner is UTC
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
