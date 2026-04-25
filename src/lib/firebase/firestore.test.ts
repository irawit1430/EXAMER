import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the config BEFORE importing firestore
vi.mock("./config", () => {
  return {
    auth: { currentUser: { uid: "test-uid" } },
    db: {},
  };
});

vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    Timestamp: {
      fromDate: vi.fn((date) => date),
    },
    serverTimestamp: vi.fn(),
    where: vi.fn(),
    arrayUnion: vi.fn(),
    getCountFromServer: vi.fn(),
    sum: vi.fn(),
    getAggregateFromServer: vi.fn(),
  };
});

import { getUserProfile } from "./firestore";
import { getDoc } from "firebase/firestore";

describe("getUserProfile", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    globalThis.window = originalWindow;
    vi.clearAllMocks();
  });

  it("should return profile data on successful fetch", async () => {
    const mockDate = new Date();
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        displayName: "John Doe",
        email: "john@example.com",
        examDate: { toDate: () => mockDate },
        targetScore: 250,
        onboardingComplete: true,
      }),
    } as any);

    const result = await getUserProfile("test-uid");

    expect(result).not.toBeNull();
    expect(result?.uid).toBe("test-uid");
    expect(result?.displayName).toBe("John Doe");
    expect(result?.email).toBe("john@example.com");
    expect(result?.examDate).toEqual(mockDate);
    expect(result?.targetScore).toBe(250);
  });

  it("should return null if user doc does not exist", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any);

    const result = await getUserProfile("non-existent-uid");
    expect(result).toBeNull();
  });

  it("should fallback early if permission is denied", async () => {
    // Force a permission denied error
    vi.mocked(getDoc).mockRejectedValueOnce({
      code: "permission-denied",
      message: "Missing or insufficient permissions.",
    });

    const result = await getUserProfile("test-uid");
    expect(result).toBeNull();
  });

  it("should fallback early on subsequent calls after permission denied", async () => {
    const result = await getUserProfile("test-uid");
    expect(result).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });
});

describe("shouldFallbackEarly behavior", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    globalThis.window = originalWindow;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should return early when running on server without auth (typeof window === 'undefined' && !auth.currentUser)", async () => {
    // 1. We mock auth.currentUser to be null
    vi.doMock("./config", () => ({
      auth: { currentUser: null },
      db: {},
    }));

    // 2. We mock typeof window to be undefined
    // @ts-expect-error we are mocking the window object to be undefined in jsdom
    delete globalThis.window;

    // 3. We import the module AFTER vi.doMock
    const { getUserProfile } = await import("./firestore");

    const result = await getUserProfile("some-uid");
    expect(result).toBeNull();
  });
});
