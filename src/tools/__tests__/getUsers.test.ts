import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetUsersTool } from "../getUsers.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetUsersTool", () => {
  const tool = new GetUsersTool();
  const validApiKey = "valid-key";
  const validApiKeyResult: { isInvalid: false; apiKey: string } = {
    isInvalid: false,
    apiKey: validApiKey,
  };
  const invalidApiKeyResult: {
    isInvalid: true;
    errorResponse: {
      content: { type: "text"; text: string }[];
      isError: boolean;
    };
  } = {
    isInvalid: true,
    errorResponse: {
      content: [{ type: "text" as const, text: "APIキーエラー" }],
      isError: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 正しいAPIキーと有効なパラメータでユーザー一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "user1" },
    ]);
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("user1");
  });

  it("正常系: パラメータ省略時でもユーザー一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 2, name: "user2" },
    ]);
    const result = await tool.execute({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("user2");
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("[]");
  });

  it("正常系: fetch_allパラメータを使用して、すべてのユーザーを取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "user1" },
      { id: 2, name: "user2" },
      { id: 3, name: "user3" },
      { id: 4, name: "user4" },
      { id: 5, name: "user5" },
    ]);
    const result = await tool.execute({ fetch_all: true });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(5);
    expect(data[0].name).toBe("user1");
    expect(data[4].name).toBe("user5");
    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestWithPaginationで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockRejectedValue(
      new Error("API失敗"),
    );
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "ユーザー一覧の取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "ユーザー一覧の取得に失敗しました",
    );
  });

  it("異常系: countが0の場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "ユーザー一覧の取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({ count: 0 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "ユーザー一覧の取得に失敗しました",
    );
  });

  it("異常系: fetch_allがtrueでcountも指定された場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({
        fetch_all: true,
        count: 10,
      });
    }).toThrow();
  });
});
