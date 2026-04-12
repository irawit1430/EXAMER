## 🎯 What:
Added comprehensive tests for the `initTracingAsync` function to ensure correct handling of global state, environment variables, and module initialization.

## 📊 Coverage:
*   Returns early if `globalForTracing.__examerTracingInitialized` is already true.
*   Returns early if the `OTEL_SDK_DISABLED` environment variable is strictly "true".
*   Returns early if the `NEXT_RUNTIME` environment variable is set and not "nodejs" (e.g., "edge").
*   Successfully proceeds to initialize the `@opentelemetry` dependencies when conditions are met (`NEXT_RUNTIME` is "nodejs" or unset). Includes complex dynamic import interception through `Promise.all` wrapping to safely mock missing modules.

## ✨ Result:
The improvement increases test coverage of `src/lib/tracing-bootstrap.ts`, resulting in fewer regressions and a stable test suite that does not hang or execute unsupported modules. Tests passed successfully using the built-in Node.js test runner in a clean and safe manner.
