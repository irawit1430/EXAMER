* When adding tests for Next.js files using absolute imports or DOM dependencies, use `vitest` with `vite-tsconfig-paths` instead of `node:test` to avoid `ERR_MODULE_NOT_FOUND` errors.
* To mock nested global object checks (like `typeof window === 'undefined'`), use `delete (globalThis as any).window` safely in jsdom environments.
