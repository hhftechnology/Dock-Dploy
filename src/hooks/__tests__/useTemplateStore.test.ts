import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useTemplateStore } from "../useTemplateStore";

const SAMPLE = [
  { id: "nginx", name: "Nginx", description: "Reverse proxy" },
  { id: "postgres", name: "Postgres", description: "DB" },
];

function mockFetchOk(payload: unknown, asText = false) {
  return vi.fn().mockResolvedValue({
    ok: true,
    statusText: "OK",
    json: async () => payload,
    text: async () => (asText ? String(payload) : JSON.stringify(payload)),
  } as unknown as Response);
}

function mockFetchFail(message = "Server error") {
  return vi.fn().mockResolvedValue({
    ok: false,
    statusText: message,
    json: async () => ({}),
    text: async () => "",
  } as unknown as Response);
}

describe("useTemplateStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches templates from GitHub on first open", async () => {
    const fetchMock = mockFetchOk(SAMPLE);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTemplateStore());
    expect(result.current.templates).toEqual([]);

    await act(async () => {
      result.current.setTemplateStoreOpen(true);
    });

    await waitFor(() => {
      expect(result.current.templates).toEqual(SAMPLE);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/meta.json");
  });

  it("surfaces an error message on fetch failure", async () => {
    const fetchMock = mockFetchFail("Not Found");
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTemplateStore());

    await act(async () => {
      result.current.setTemplateStoreOpen(true);
    });

    await waitFor(() => {
      expect(result.current.templateError).toMatch(/Not Found/i);
    });
    expect(result.current.templateLoading).toBe(false);
  });

  it("uses cached templates when fresh, and refreshes clears them", async () => {
    localStorage.setItem("templateStoreCache", JSON.stringify(SAMPLE));
    localStorage.setItem("templateStoreCacheTimestamp", String(Date.now()));

    const fetchMock = mockFetchOk(SAMPLE);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTemplateStore());
    // initial state from cache
    expect(result.current.templates).toEqual(SAMPLE);

    await act(async () => {
      result.current.refreshTemplateStore();
    });

    await waitFor(() => {
      // Refresh triggers a fetch even though cache existed
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("fetchTemplateDetails throws when template not in list", async () => {
    const { result } = renderHook(() => useTemplateStore());
    await expect(
      result.current.fetchTemplateDetails("missing"),
    ).rejects.toThrow(/not found/i);
  });
});
