import { vi } from "vitest";

// Silence console.warn for tests
vi.spyOn(console, "warn").mockImplementation(() => {});
