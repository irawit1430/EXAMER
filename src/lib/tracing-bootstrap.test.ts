import { test, mock } from "node:test";
import assert from "node:assert";
import { initTracingAsync, initTracing } from "./tracing-bootstrap.ts";

test("initTracing", async (t) => {
  let originalEnv: NodeJS.ProcessEnv;

  t.beforeEach(() => {
    originalEnv = { ...process.env };
    const globalForTracing = globalThis as any;
    globalForTracing.__examerTracingInitialized = undefined;
  });

  t.afterEach(() => {
    // Restore environment variables completely
    for (const key in process.env) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const key in originalEnv) {
      process.env[key] = originalEnv[key];
    }
    const globalForTracing = globalThis as any;
    globalForTracing.__examerTracingInitialized = undefined;
  });

  await t.test("calls initTracingAsync", async () => {
    process.env.OTEL_SDK_DISABLED = "true";
    initTracing();

    const globalForTracing = globalThis as any;
    assert.strictEqual(globalForTracing.__examerTracingInitialized, true);
  });
});

test("initTracingAsync", async (t) => {
  let originalEnv: NodeJS.ProcessEnv;
  let logOutput: string[] = [];
  const originalConsoleLog = console.log;
  const originalPromiseAll = Promise.all;

  t.beforeEach(() => {
    originalEnv = { ...process.env };
    const globalForTracing = globalThis as any;
    globalForTracing.__examerTracingInitialized = undefined;
    logOutput = [];
    console.log = (...args) => logOutput.push(args.join(" "));
  });

  t.afterEach(() => {
    // Restore environment variables completely
    for (const key in process.env) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const key in originalEnv) {
      process.env[key] = originalEnv[key];
    }
    const globalForTracing = globalThis as any;
    globalForTracing.__examerTracingInitialized = undefined;
    console.log = originalConsoleLog;
    Promise.all = originalPromiseAll;
    mock.restoreAll();
  });

  await t.test("returns early if already initialized", async () => {
    const globalForTracing = globalThis as any;
    globalForTracing.__examerTracingInitialized = true;
    await initTracingAsync();
    assert.deepStrictEqual(logOutput, []);
  });

  await t.test("returns early if OTEL_SDK_DISABLED is true", async () => {
    process.env.OTEL_SDK_DISABLED = "true";
    await initTracingAsync();
    assert.deepStrictEqual(logOutput, []);
    const globalForTracing = globalThis as any;
    assert.strictEqual(globalForTracing.__examerTracingInitialized, true);
  });

  await t.test(
    "returns early if NEXT_RUNTIME is set and not nodejs",
    async () => {
      process.env.NEXT_RUNTIME = "edge";
      await initTracingAsync();
      assert.deepStrictEqual(logOutput, []);
      const globalForTracing = globalThis as any;
      assert.strictEqual(globalForTracing.__examerTracingInitialized, true);
    },
  );

  await t.test(
    "proceeds to initialize and requires dependencies if NEXT_RUNTIME is nodejs",
    async () => {
      process.env.NEXT_RUNTIME = "nodejs";
      delete process.env.OTEL_SDK_DISABLED;

      const mockOtlpModule = {
        OTLPTraceExporter: class {
          url: string;
          constructor(opts: any) {
            this.url = opts.url;
          }
        },
      };

      const mockInstrumentationModule = {
        registerInstrumentations: mock.fn(),
      };

      const mockUndiciModule = {
        UndiciInstrumentation: class {},
      };

      const mockResourcesModule = {
        resourceFromAttributes: mock.fn((attrs) => attrs),
      };

      const mockSdkTraceModule = {
        NodeTracerProvider: class {
          register = mock.fn();
        },
        SimpleSpanProcessor: class {},
      };

      Promise.all = function (values: any) {
        if (Array.isArray(values) && values.length === 5) {
            for (const p of values) {
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {});
                }
            }
            return originalPromiseAll.call(this, [
                Promise.resolve(mockOtlpModule),
                Promise.resolve(mockInstrumentationModule),
                Promise.resolve(mockUndiciModule),
                Promise.resolve(mockResourcesModule),
                Promise.resolve(mockSdkTraceModule),
            ]);
        }
        return originalPromiseAll.call(this, values);
      } as typeof Promise.all;

      await initTracingAsync();

      const globalForTracing = globalThis as any;
      assert.strictEqual(globalForTracing.__examerTracingInitialized, true);
      assert.strictEqual(logOutput.length, 1);
      assert.match(
        logOutput[0],
        /\[Tracing\] OpenTelemetry initialized for examer/,
      );
      assert.strictEqual(mockInstrumentationModule.registerInstrumentations.mock.callCount(), 1);
    },
  );

  await t.test(
    "proceeds to initialize and requires dependencies if NEXT_RUNTIME is unset",
    async () => {
      delete process.env.NEXT_RUNTIME;
      delete process.env.OTEL_SDK_DISABLED;

      const mockOtlpModule = {
        OTLPTraceExporter: class {
          url: string;
          constructor(opts: any) {
            this.url = opts.url;
          }
        },
      };

      const mockInstrumentationModule = {
        registerInstrumentations: mock.fn(),
      };

      const mockUndiciModule = {
        UndiciInstrumentation: class {},
      };

      const mockResourcesModule = {
        resourceFromAttributes: mock.fn((attrs) => attrs),
      };

      const mockSdkTraceModule = {
        NodeTracerProvider: class {
          register = mock.fn();
        },
        SimpleSpanProcessor: class {},
      };

      Promise.all = function (values: any) {
        if (Array.isArray(values) && values.length === 5) {
            for (const p of values) {
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {});
                }
            }
            return originalPromiseAll.call(this, [
                Promise.resolve(mockOtlpModule),
                Promise.resolve(mockInstrumentationModule),
                Promise.resolve(mockUndiciModule),
                Promise.resolve(mockResourcesModule),
                Promise.resolve(mockSdkTraceModule),
            ]);
        }
        return originalPromiseAll.call(this, values);
      } as typeof Promise.all;

      await initTracingAsync();

      const globalForTracing = globalThis as any;
      assert.strictEqual(globalForTracing.__examerTracingInitialized, true);
      assert.strictEqual(logOutput.length, 1);
      assert.match(
        logOutput[0],
        /\[Tracing\] OpenTelemetry initialized for examer/,
      );
      assert.strictEqual(mockInstrumentationModule.registerInstrumentations.mock.callCount(), 1);
    },
  );
});
