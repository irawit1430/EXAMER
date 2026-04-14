import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { streamMentorResponse } from "../useMentorSync.ts";

// Mock dependencies
let mentorStoreMock: any;
let authStoreMock: any;

vi.mock("../../store/useMentorStore", () => {
  return {
    useMentorStore: {
      getState: vi.fn(() => mentorStoreMock),
    },
  };
});

vi.mock("../../store/useAuthStore", () => {
  return {
    useAuthStore: {
      getState: vi.fn(() => authStoreMock),
    },
  };
});

vi.mock("../../store/useStudyStore", () => ({
  useStudyStore: { getState: vi.fn(() => ({})) },
}));

vi.mock("../../store/useMetricsStore", () => ({
  useMetricsStore: { getState: vi.fn(() => ({})) },
}));

vi.mock("../../lib/firebase/firestore", () => ({
  getMentorMemory: vi.fn(async () => ({})),
}));

describe("streamMentorResponse", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;

    mentorStoreMock = {
      startStreamingMentor: vi.fn(),
      finishStreaming: vi.fn(),
      appendStreamChunk: vi.fn(),
    };

    authStoreMock = {
      user: {
        getIdToken: vi.fn(async () => "fake-token"),
      },
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should return false and call finishStreaming when API throws (network error path)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("API down"));

    const result = await streamMentorResponse(
      "test-user",
      "test-session",
      {} as any,
      "idle",
    );

    expect(result).toBe(false);
    expect(mentorStoreMock.finishStreaming).toHaveBeenCalled();
  });

  it("should return false and call finishStreaming when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const result = await streamMentorResponse(
      "test-user",
      "test-session",
      {} as any,
      "idle",
    );

    expect(result).toBe(false);
    expect(mentorStoreMock.finishStreaming).toHaveBeenCalled();
  });

  it("should call finishStreaming when JSON stream parsing throws in the reader (error path inside try/catch)", async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            'data: {"type": "text", "text": "hello"}\n',
          ),
        })
        .mockRejectedValueOnce(new Error("Simulated stream break")),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const result = await streamMentorResponse(
      "test-user",
      "test-session",
      {} as any,
      "idle",
    );

    expect(result).toBe(false);
    expect(mentorStoreMock.finishStreaming).toHaveBeenCalled();
    expect(mentorStoreMock.appendStreamChunk).toHaveBeenCalledWith("hello");
  });
});
