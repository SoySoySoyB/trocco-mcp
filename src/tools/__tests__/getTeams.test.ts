import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetTeamsTool } from "../getTeams.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetTeamsTool", () => {
  const tool = new GetTeamsTool();
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

  it("正常系: 正しいAPIキーと有効なパラメータでチーム一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Engineering Team", description: "Development team" },
    ]);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Engineering Team");
  });

  it("正常系: パラメータ省略時でもチーム一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 2, name: "Team 2" },
    ]);
    const result = await tool.execute({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Team 2");
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("[]");
  });

  it("正常系: fetch_allパラメータを使用して、すべてのチームを取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Team 1", description: "Development Team" },
      { id: 2, name: "Team 2", description: "Marketing Team" },
      { id: 3, name: "Team 3", description: "Sales Team" },
      { id: 4, name: "Team 4", description: "Support Team" },
    ]);
    const result = await tool.execute({ fetch_all: true, limit: 1 });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(4);
    expect(data[0].name).toBe("Team 1");
    expect(data[3].name).toBe("Team 4");
    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestWithPaginationで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockRejectedValue(
      new Error("API失敗"),
    );
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "チーム一覧の取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("チーム一覧の取得に失敗しました");
  });

  it("異常系: limitが範囲外の場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "チーム一覧の取得に失敗しました" }],
      isError: true,
    });
    const result1 = await tool.execute({ limit: 0 });
    expect(result1.isError).toBeTruthy();
    expect(result1.content[0].text).toContain("チーム一覧の取得に失敗しました");
    const result2 = await tool.execute({ limit: 201 });
    expect(result2.isError).toBeTruthy();
    expect(result2.content[0].text).toContain("チーム一覧の取得に失敗しました");
  });
});
