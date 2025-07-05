import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetLabelsTool } from "../getLabels.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetLabelsTool", () => {
  const tool = new GetLabelsTool();
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

  it("正常系: 正しいAPIキーと有効なパラメータでラベル一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "label1" },
    ]);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("label1");
  });

  it("正常系: パラメータ省略時でもラベル一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 2, name: "label2" },
    ]);
    const result = await tool.execute({});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("label2");
  });

  it("正常系: job_definition_idのみ指定した場合でも正常に動作する", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 4, name: "label3" },
    ]);
    const result = await tool.execute({ job_definition_id: 123, limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("label3");
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("[]");
  });

  it("正常系: fetch_allパラメータを使用して、すべてのラベルを取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "label1", color: "#FF0000" },
      { id: 2, name: "label2", color: "#00FF00" },
      { id: 3, name: "label3", color: "#0000FF" },
      { id: 4, name: "label4", color: "#FFFF00" },
      { id: 5, name: "label5", color: "#FF00FF" },
    ]);
    const result = await tool.execute({ fetch_all: true, limit: 1 });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(5);
    expect(data[0].name).toBe("label1");
    expect(data[4].name).toBe("label5");
    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: job_definition_bulk_idを指定した場合でも正常に動作する", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 10, name: "bulk_label1" },
      { id: 11, name: "bulk_label2" },
    ]);
    const result = await tool.execute({
      job_definition_bulk_id: 456,
      limit: 10,
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("bulk_label1");
  });

  it("正常系: datamart_definition_idを指定した場合でも正常に動作する", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 20, name: "datamart_label1" },
    ]);
    const result = await tool.execute({
      datamart_definition_id: 789,
      limit: 10,
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("datamart_label1");
  });

  it("正常系: pipeline_definition_idを指定した場合でも正常に動作する", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 30, name: "pipeline_label1" },
      { id: 31, name: "pipeline_label2" },
      { id: 32, name: "pipeline_label3" },
    ]);
    const result = await tool.execute({
      pipeline_definition_id: 999,
      limit: 10,
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(3);
    expect(data[0].name).toBe("pipeline_label1");
    expect(data[2].name).toBe("pipeline_label3");
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
      content: [{ type: "text", text: "ラベル一覧の取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({ limit: 10 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("ラベル一覧の取得に失敗しました");
  });

  it("異常系: limitが範囲外の場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "ラベル一覧の取得に失敗しました" }],
      isError: true,
    });
    const result1 = await tool.execute({ limit: 0 });
    expect(result1.isError).toBeTruthy();
    expect(result1.content[0].text).toContain("ラベル一覧の取得に失敗しました");
    const result2 = await tool.execute({ limit: 201 });
    expect(result2.isError).toBeTruthy();
    expect(result2.content[0].text).toContain("ラベル一覧の取得に失敗しました");
  });

  // 注意: 複数IDパラメータのバリデーションはZodのrefineで実装されているため、
  // MCPフレームワーク側でバリデーションされ、executeメソッドには到達しません。
  // そのため、単体テストではカバーできません。
});
