import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  troccoRequest,
  troccoRequestWithPagination,
} from "../requestTROCCO.js";

// fetch のモック
global.fetch = vi.fn();

describe("troccoRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("正常系: 成功レスポンスを正しく処理できる", async () => {
    const mockResponse = { data: "test" };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await troccoRequest(
      "https://trocco.io/api/test",
      "test-key",
      {
        method: "GET",
      },
    );

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://trocco.io/api/test",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Token test-key",
        }),
      }),
    );
  });

  it("異常系: JSONエラーレスポンスを適切に処理できる", async () => {
    const errorMessage = "Not Authorized";
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => JSON.stringify({ message: errorMessage }),
    } as Response);

    await expect(
      troccoRequest("https://trocco.io/api/test", "invalid-key", {
        method: "GET",
      }),
    ).rejects.toThrow(
      `TROCCO APIのリクエストが失敗しました: ${errorMessage}\n` +
        `URL: https://trocco.io/api/test\n` +
        `Method: GET\n` +
        `Status: 403`,
    );
  });

  it("異常系: 非JSONエラーレスポンスを適切に処理できる", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Not Found",
    } as Response);

    await expect(
      troccoRequest("https://trocco.io/api/not-exist", "test-key", {
        method: "GET",
      }),
    ).rejects.toThrow(
      `TROCCO APIのリクエストが失敗しました: HTTP 404 Not Found\n` +
        `URL: https://trocco.io/api/not-exist\n` +
        `Method: GET\n` +
        `Status: 404`,
    );
  });

  it("異常系: errorプロパティを持つJSONエラーレスポンスを処理できる", async () => {
    const errorMessage = "Invalid request";
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: errorMessage }),
    } as Response);

    await expect(
      troccoRequest("https://trocco.io/api/test", "test-key", {
        method: "POST",
        body: { invalid: "data" },
      }),
    ).rejects.toThrow(errorMessage);
  });
});

describe("troccoRequestWithPagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("正常系: ページネーションを正しく処理できる", async () => {
    // 1ページ目
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 1 }, { id: 2 }],
        next_cursor: "cursor-2",
      }),
    } as Response);

    // 2ページ目
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 3 }, { id: 4 }],
        next_cursor: null,
      }),
    } as Response);

    const result = await troccoRequestWithPagination(
      "https://trocco.io/api/items",
      "test-key",
      { method: "GET", fetch_all: true },
    );

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // 2回目の呼び出しでcursorパラメータが追加されていることを確認
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://trocco.io/api/items?cursor=cursor-2",
      expect.any(Object),
    );
  });

  it("正常系: ページネーションなしのレスポンスを処理できる", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 1 }],
        next_cursor: null,
      }),
    } as Response);

    const result = await troccoRequestWithPagination(
      "https://trocco.io/api/items",
      "test-key",
      { method: "GET" },
    );

    expect(result).toEqual([{ id: 1 }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("正常系: fetchAll=falseで1ページのみ取得できる", async () => {
    // 1ページ目
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 1 }, { id: 2 }],
        next_cursor: "cursor-2",
      }),
    } as Response);

    const result = await troccoRequestWithPagination(
      "https://trocco.io/api/items",
      "test-key",
      { method: "GET", fetch_all: false },
    );

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("正常系: fetchAll=falseでcursor指定時は指定したページから取得できる", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: 3 }, { id: 4 }],
        next_cursor: "cursor-3",
      }),
    } as Response);

    const result = await troccoRequestWithPagination(
      "https://trocco.io/api/items",
      "test-key",
      {
        method: "GET",
        fetch_all: false,
        params: {
          query_params: {
            cursor: "cursor-2",
          },
        },
      },
    );

    expect(result).toEqual([{ id: 3 }, { id: 4 }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://trocco.io/api/items?cursor=cursor-2",
      expect.any(Object),
    );
  });
});
