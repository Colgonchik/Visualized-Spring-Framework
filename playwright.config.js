import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:57321',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { channel: 'msedge' },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:57321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
