import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetConnectionConfigurationDetailTool } from "../getConnectionConfigurationDetail.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequest } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetConnectionConfigurationDetailTool", () => {
  const tool = new GetConnectionConfigurationDetailTool();
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

  it("正常系: 正しいAPIキーと有効な接続タイプ・IDで接続設定詳細が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockResolvedValue({
      id: 10,
      name: "BigQuery本番環境",
      connection_type: "bigquery",
      project_id: "my-project",
    });
    const result = await tool.execute({
      connection_type: "bigquery",
      connection_id: 10,
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("10");
    expect(result.content[0].text).toContain("BigQuery本番環境");
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({
      connection_type: "bigquery",
      connection_id: 10,
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("API失敗"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        {
          type: "text",
          text: "接続情報ID 10 (bigquery) の詳細取得に失敗しました",
        },
      ],
      isError: true,
    });
    const result = await tool.execute({
      connection_type: "bigquery",
      connection_id: 10,
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "接続情報ID 10 (bigquery) の詳細取得に失敗しました",
    );
  });

  it("異常系: 存在しない接続IDの場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("404 Not Found"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        {
          type: "text",
          text: "接続情報ID 99999 (s3) の詳細取得に失敗しました",
        },
      ],
      isError: true,
    });
    const result = await tool.execute({
      connection_type: "s3",
      connection_id: 99999,
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "接続情報ID 99999 (s3) の詳細取得に失敗しました",
    );
  });

  it("異常系: 無効な接続タイプの場合、バリデーションエラーになる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        {
          type: "text",
          text: "接続情報ID 10 (invalid_type) の詳細取得に失敗しました",
        },
      ],
      isError: true,
    });
    const result = await tool.execute({
      connection_type: "invalid_type" as any,
      connection_id: 10,
    });
    expect(result.isError).toBeTruthy();
  });
});
