import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetJobDefinitionsTool } from "../getJobDefinitions.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetJobDefinitionsTool", () => {
  const tool = new GetJobDefinitionsTool();
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

  it("正常系: 正しいAPIキーと有効なパラメータで転送設定一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Test Job Definition", description: "Test description" },
    ]);
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Test Job Definition");
  });

  it("正常系: パラメータ省略時でも転送設定一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 2, name: "Job Definition 2" },
    ]);
    const result = await tool.execute({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Job Definition 2");
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("[]");
  });

  it("正常系: fetch_allパラメータを使用して、すべての転送設定を取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Job 1", description: "JD1" },
      { id: 2, name: "Job 2", description: "JD2" },
      { id: 3, name: "Job 3", description: "JD3" },
      { id: 4, name: "Job 4", description: "JD4" },
    ]);
    const result = await tool.execute({ fetch_all: true });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(4);
    expect(data[0].name).toBe("Job 1");
    expect(data[3].name).toBe("Job 4");
    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: nameパラメータで転送設定名をフィルタリングできる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Sales Data Import", description: "Import sales data" },
      {
        id: 2,
        name: "Sales Report Export",
        description: "Export sales report",
      },
    ]);
    const result = await tool.execute({
      count: 10,
      query_params: { name: "Sales" },
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(2);
    expect(data[0].name).toContain("Sales");
    expect(data[1].name).toContain("Sales");
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
      content: [{ type: "text", text: "転送設定一覧の取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({ count: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "転送設定一覧の取得に失敗しました",
    );
  });

  it("異常系: limitが範囲外の場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "転送設定一覧の取得に失敗しました" }],
      isError: true,
    });
    const result1 = await tool.execute({ count: 0 });
    expect(result1.isError).toBeTruthy();
    expect(result1.content[0].text).toContain(
      "転送設定一覧の取得に失敗しました",
    );
    const result2 = await tool.execute({ count: 201 });
    expect(result2.isError).toBeTruthy();
    expect(result2.content[0].text).toContain(
      "転送設定一覧の取得に失敗しました",
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
