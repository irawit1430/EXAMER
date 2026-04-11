import { test, describe, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import { initTracingAsync } from "./tracing-bootstrap.ts";

const originalEnv = process.env;

type TracingGlobal = typeof globalThis & {
  __examerTracingInitialized?: boolean;
};
const globalForTracing = globalThis as TracingGlobal;

describe("initTracingAsync", () => {
  let consoleLogMock: any;

  beforeEach(() => {
    process.env = { ...originalEnv };
    globalForTracing.__examerTracingInitialized = false;
    consoleLogMock = mock.method(console, "log", () => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    mock.restoreAll();
  });

  test("should return early if already initialized", async () => {
    globalForTracing.__examerTracingInitialized = true;
    await initTracingAsync();
    assert.strictEqual(consoleLogMock.mock.calls.length, 0);
  });

  test("should return early if OTEL_SDK_DISABLED is true", async () => {
    process.env.OTEL_SDK_DISABLED = "true";
    await initTracingAsync();
    assert.strictEqual(consoleLogMock.mock.calls.length, 0);
  });

  test("should return early if NEXT_RUNTIME is set and not nodejs", async () => {
    process.env.NEXT_RUNTIME = "edge";
    await initTracingAsync();
    assert.strictEqual(consoleLogMock.mock.calls.length, 0);
  });

  test("should initialize tracing if not disabled", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.OTEL_SERVICE_NAME = "test-service";
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT =
      "http://localhost:4318/v1/traces";
    await initTracingAsync();

    assert.strictEqual(globalForTracing.__examerTracingInitialized, true);
    assert.strictEqual(consoleLogMock.mock.calls.length, 1);
    const logCall = consoleLogMock.mock.calls[0].arguments[0];
    assert.ok(
      logCall.includes("[Tracing] OpenTelemetry initialized for test-service"),
    );
    assert.ok(logCall.includes("http://localhost:4318/v1/traces"));
  });
});
