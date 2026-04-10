export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
        return;
    }

    const { initTracingAsync } = await import('./src/lib/tracing-bootstrap');
    await initTracingAsync();
}
