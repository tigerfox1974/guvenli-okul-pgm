// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const DEFAULT_BASE_URL = 'http://localhost:5500';
const baseURL = String(process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL)
  .trim()
  .replace(/\/+$/, '');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL,
    headless: true,
    locale: 'tr-TR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
