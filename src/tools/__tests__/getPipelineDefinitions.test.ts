import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPipelineDefinitionsTool } from "../getPipelineDefinitions.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetPipelineDefinitionsTool", () => {
  const tool = new GetPipelineDefinitionsTool();
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

  it("正常系: 正しいAPIキーと有効なパラメータでワークフロー定義一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Test Pipeline", description: "Test workflow" },
    ]);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Test Pipeline");
  });

  it("正常系: パラメータ省略時でもワークフロー定義一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 2, name: "Pipeline 2" },
    ]);
    const result = await tool.execute({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Pipeline 2");
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("[]");
  });

  it("正常系: fetch_allパラメータを使用して、すべてのワークフロー定義を取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "Pipeline 1", enabled: true },
      { id: 2, name: "Pipeline 2", enabled: false },
      { id: 3, name: "Pipeline 3", enabled: true },
      { id: 4, name: "Pipeline 4", enabled: true },
    ]);
    const result = await tool.execute({ fetch_all: true, limit: 1 });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(4);
    expect(data[0].name).toBe("Pipeline 1");
    expect(data[3].name).toBe("Pipeline 4");
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
      content: [
        { type: "text", text: "ワークフロー定義一覧の取得に失敗しました" },
      ],
      isError: true,
    });
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "ワークフロー定義一覧の取得に失敗しました",
    );
  });

  it("異常系: limitが範囲外の場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        { type: "text", text: "ワークフロー定義一覧の取得に失敗しました" },
      ],
      isError: true,
    });
    const result1 = await tool.execute({ limit: 0 });
    expect(result1.isError).toBeTruthy();
    expect(result1.content[0].text).toContain(
      "ワークフロー定義一覧の取得に失敗しました",
    );
    const result2 = await tool.execute({ limit: 201 });
    expect(result2.isError).toBeTruthy();
    expect(result2.content[0].text).toContain(
      "ワークフロー定義一覧の取得に失敗しました",
    );
  });
});
