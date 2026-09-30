import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://127.0.0.1:5188", headless: true },
  webServer: {
    command: "npm run dev -- --port 5188 --strictPort --host 127.0.0.1",
    url: "http://127.0.0.1:5188",
    reuseExistingServer: true,
  },
  reporter: "list",
});
