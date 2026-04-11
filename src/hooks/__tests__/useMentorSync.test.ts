import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamMentorResponse } from '../useMentorSync';
import { useMentorStore } from '@/store/useMentorStore';
import { useAuthStore } from '@/store/useAuthStore';

vi.mock('@/store/useMentorStore', () => ({
  useMentorStore: {
    getState: vi.fn(),
  },
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

vi.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
}));

vi.mock('@/lib/firebase/firestore', () => ({
  getMentorMemory: vi.fn(),
}));

describe('streamMentorResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle network error and call finishStreaming', async () => {
    let startStreamingCalled = false;
    let finishStreamingCalled = false;

    // @ts-expect-error Mocking Zustand store
    useMentorStore.getState.mockReturnValue({
      startStreamingMentor: () => { startStreamingCalled = true; },
      finishStreaming: () => { finishStreamingCalled = true; },
      appendStreamChunk: () => {}
    });

    // @ts-expect-error Mocking Auth store
    useAuthStore.getState.mockReturnValue({
      user: null
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network timeout'));

    // @ts-expect-error Mock AI context payload to keep test clean
    const result = await streamMentorResponse('user_123', 'session_123', {}, 'idle');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
    expect(startStreamingCalled).toBe(true);
    expect(finishStreamingCalled).toBe(true);
  });
});
