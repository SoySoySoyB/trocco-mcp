import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetJobsTool } from "../getJobs.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetJobsTool", () => {
  const tool = new GetJobsTool();
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

  it("正常系: 正しいAPIキーと有効なパラメータでジョブ一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 1, name: "job1", status: "succeeded" },
    ]);
    const result = await tool.execute({
      path_params: { job_definition_id: 123 },
      count: 10,
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("job1");
    expect(result.content[0].text).toContain("succeeded");
  });

  it("正常系: 最小限のパラメータ（job_definition_idのみ）でもジョブ一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 2, name: "job2", status: "running" },
    ]);
    const result = await tool.execute({
      path_params: { job_definition_id: 456 },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("job2");
    expect(result.content[0].text).toContain("running");
  });

  it("正常系: 時間範囲を指定してジョブ一覧が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 3, name: "job3", status: "failed" },
    ]);
    const result = await tool.execute({
      path_params: { job_definition_id: 789 },
      query_params: {
        start_time: "2024-01-01 00:00:00",
        end_time: "2024-01-31 23:59:59",
        time_zone: "Asia/Tokyo",
      },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("job3");
    expect(result.content[0].text).toContain("failed");
  });

  it("正常系: fetch_allをfalseに設定した場合でも正常に動作する", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 4, name: "job4" },
    ]);
    const result = await tool.execute({
      path_params: { job_definition_id: 111 },
      fetch_all: false,
      count: 5,
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("job4");
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);
    const result = await tool.execute({
      path_params: { job_definition_id: 999 },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("[]");
  });

  it("正常系: fetch_allパラメータを使用して、すべてのジョブを取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([
      { id: 10, name: "job10", status: "success" },
      { id: 11, name: "job11", status: "running" },
      { id: 12, name: "job12", status: "failed" },
      { id: 13, name: "job13", status: "success" },
      { id: 14, name: "job14", status: "queued" },
    ]);
    const result = await tool.execute({
      path_params: { job_definition_id: 123 },
      fetch_all: true,
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(5);
    expect(data[0].name).toBe("job10");
    expect(data[4].name).toBe("job14");
    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({
      path_params: { job_definition_id: 123 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestWithPaginationで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockRejectedValue(
      new Error("API失敗"),
    );
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "転送ジョブ一覧の取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({
      path_params: { job_definition_id: 123 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "転送ジョブ一覧の取得に失敗しました",
    );
  });

  it("異常系: limitが範囲外の場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "転送ジョブ一覧の取得に失敗しました" }],
      isError: true,
    });
    const result1 = await tool.execute({
      path_params: { job_definition_id: 123 },
      count: 0,
    });
    expect(result1.isError).toBeTruthy();
    expect(result1.content[0].text).toContain(
      "転送ジョブ一覧の取得に失敗しました",
    );
    const result2 = await tool.execute({
      path_params: { job_definition_id: 123 },
      count: 101,
    });
    expect(result2.isError).toBeTruthy();
    expect(result2.content[0].text).toContain(
      "転送ジョブ一覧の取得に失敗しました",
    );
  });

  it("異常系: fetch_allがtrueでcountも指定された場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({
        path_params: { job_definition_id: 123 },
        fetch_all: true,
        count: 10,
      });
    }).toThrow();
  });
});
