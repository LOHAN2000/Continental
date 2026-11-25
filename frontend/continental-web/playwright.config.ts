
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  fullyParallel: false,
  workers: 1,
  retries: 0,

  timeout: 180_000,

expect: {
  timeout: 30_000,
},

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder:
          "../../evidencias-pa03/acceptance-tests/playwright-report",
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile:
          "../../evidencias-pa03/acceptance-tests/playwright-results.json",
      },
    ],
  ],

  outputDir:
    "../../evidencias-pa03/acceptance-tests/playwright-artifacts",

  use: {
    baseURL:
      process.env.QA_BASE_URL || "http://localhost:3000",

    screenshot: "on",
    video: "off",
    trace: "retain-on-failure",

    actionTimeout: 30_000,
  navigationTimeout: 120_000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },
  ],
});
