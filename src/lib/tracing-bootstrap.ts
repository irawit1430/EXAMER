type TracingGlobal = typeof globalThis & {
  __examerTracingInitialized?: boolean;
};

const globalForTracing = globalThis as TracingGlobal;

function getTraceEndpoint(): string {
  return (
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces"
  );
}

export function initTracing(): void {
  void initTracingAsync();
}

export async function initTracingAsync(): Promise<void> {
  if (globalForTracing.__examerTracingInitialized) {
    return;
  }

  globalForTracing.__examerTracingInitialized = true;

  if (process.env.OTEL_SDK_DISABLED === "true") {
    return;
  }

  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || "examer";

  const [
    otlpModule,
    instrumentationModule,
    undiciModule,
    resourcesModule,
    sdkTraceModule,
  ] = await Promise.all([
    import("@opentelemetry/exporter-trace-otlp-http"),
    import("@opentelemetry/instrumentation"),
    import("@opentelemetry/instrumentation-undici"),
    import("@opentelemetry/resources"),
    import("@opentelemetry/sdk-trace-node"),
  ]);

  const exporter = new otlpModule.OTLPTraceExporter({
    url: getTraceEndpoint(),
  });

  const provider = new sdkTraceModule.NodeTracerProvider({
    resource: resourcesModule.resourceFromAttributes({
      "service.name": serviceName,
      "service.version": process.env.npm_package_version || "0.1.0",
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
    spanProcessors: [new sdkTraceModule.SimpleSpanProcessor(exporter)],
  });

  provider.register();

  instrumentationModule.registerInstrumentations({
    instrumentations: [new undiciModule.UndiciInstrumentation()],
  });

  console.log(
    `[Tracing] OpenTelemetry initialized for ${serviceName} -> ${getTraceEndpoint()}`,
  );
}
