import {
  trace,
  SpanStatusCode,
  type Span,
  type SpanAttributes,
} from "@opentelemetry/api";

export async function traceAsync<T>(
  spanName: string,
  attributes: SpanAttributes,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer("examer");

  return tracer.startActiveSpan(spanName, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error?.message || "Unknown tracing error",
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
