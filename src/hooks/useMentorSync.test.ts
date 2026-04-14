import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMentorSync } from "./useMentorSync";
import { useMentorStore } from "@/store/useMentorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useStudyStore } from "@/store/useStudyStore";
import { useMetricsStore } from "@/store/useMetricsStore";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/store/useMentorStore", () => {
  const useMentorStore = vi.fn();
  (useMentorStore as any).getState = vi.fn();
  (useMentorStore as any).subscribe = vi.fn();
  return { useMentorStore };
});

vi.mock("@/store/useAuthStore", () => {
  const useAuthStore = vi.fn();
  (useAuthStore as any).getState = vi.fn();
  (useAuthStore as any).subscribe = vi.fn();
  return { useAuthStore };
});

vi.mock("@/store/useStudyStore", () => {
  const useStudyStore = vi.fn();
  (useStudyStore as any).getState = vi.fn();
  (useStudyStore as any).subscribe = vi.fn();
  return { useStudyStore };
});

vi.mock("@/store/useMetricsStore", () => {
  const useMetricsStore = vi.fn();
  (useMetricsStore as any).getState = vi.fn();
  (useMetricsStore as any).subscribe = vi.fn();
  return { useMetricsStore };
});

// We also need to mock firebase/firestore
vi.mock("@/lib/firebase/firestore", () => ({
  getMentorMemory: vi.fn().mockResolvedValue({}),
}));

describe("useMentorSync", () => {
  let mockConsoleError: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Default mocks
    (useAuthStore.getState as any).mockReturnValue({
      user: { uid: "test-uid", getIdToken: vi.fn().mockResolvedValue("token") },
      profile: { uid: "test-uid" },
    });

    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      if (typeof selector === "function") {
        return selector({
          user: { uid: "test-uid" },
          profile: { uid: "test-uid" },
        });
      }
      return { user: { uid: "test-uid" }, profile: { uid: "test-uid" } };
    });

    (useStudyStore.getState as any).mockReturnValue({
      sessionActive: true,
      timer: 400, // triggers idle
    });

    (useMetricsStore.getState as any).mockReturnValue({
      questionsAttempted: 0,
      consecutiveErrors: 0,
      speed: 1,
      correctCount: 0,
    });

    // Mock fetch to reject
    global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  it("should finish streaming and log error if fetch fails during streamMentorResponse", async () => {
    const mockStartStreamingMentor = vi.fn();
    const mockFinishStreaming = vi.fn();
    const mockTriggerMentor = vi.fn();

    (useMentorStore.getState as any).mockReturnValue({
      startStreamingMentor: mockStartStreamingMentor,
      finishStreaming: mockFinishStreaming,
      triggerMentor: mockTriggerMentor,
      isExpanded: false,
    });

    vi.mocked(useMentorStore).mockImplementation((selector: any) => {
      if (typeof selector === "function") {
        return selector({
          startStreamingMentor: mockStartStreamingMentor,
          finishStreaming: mockFinishStreaming,
          triggerMentor: mockTriggerMentor,
          setPulsing: vi.fn(),
          isVisible: false,
          isExpanded: false,
        });
      }
      return {
        startStreamingMentor: mockStartStreamingMentor,
        finishStreaming: mockFinishStreaming,
        triggerMentor: mockTriggerMentor,
        setPulsing: vi.fn(),
        isVisible: false,
        isExpanded: false,
      };
    });

    // To trigger streamMentorResponse, we need to call evaluateState
    // which triggers when study timer > threshold (idle)
    const { result } = renderHook(() => useMentorSync());

    await act(async () => {
      await result.current.evaluateState();
    });

    // wait for async fetch
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert finishStreaming is called
    expect(mockFinishStreaming).toHaveBeenCalled();

    // Assert console.error was called with the specific message
    expect(mockConsoleError).toHaveBeenCalledWith(
      "[MentorSync] Streaming failed:",
      expect.any(Error),
    );

    // And fallback message should have been triggered
    expect(mockTriggerMentor).toHaveBeenCalledWith("idle", expect.any(String));
  });
});
