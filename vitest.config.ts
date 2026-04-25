import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/lib/firebase/firestore.test.ts"], // Only run our tests in vitest, others in node:test
  },
});
