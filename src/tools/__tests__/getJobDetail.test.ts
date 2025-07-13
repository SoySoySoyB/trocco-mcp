import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetJobDetailTool } from "../getJobDetail.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequest } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetJobDetailTool", () => {
  const tool = new GetJobDetailTool();
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

  it("正常系: 正しいAPIキーと有効なジョブIDでジョブ詳細が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockResolvedValue({
      id: 12345,
      job_definition_id: 100,
      job_definition_name: "テストジョブ",
      status: "succeeded",
    });
    const result = await tool.execute({
      path_params: { job_id: 12345 },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("12345");
    expect(result.content[0].text).toContain("succeeded");
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({
      path_params: { job_id: 12345 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("API失敗"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        { type: "text", text: "転送ジョブID 12345 の詳細取得に失敗しました" },
      ],
      isError: true,
    });
    const result = await tool.execute({
      path_params: { job_id: 12345 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "転送ジョブID 12345 の詳細取得に失敗しました",
    );
  });

  it("異常系: 存在しないジョブIDの場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("404 Not Found"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        { type: "text", text: "転送ジョブID 99999 の詳細取得に失敗しました" },
      ],
      isError: true,
    });
    const result = await tool.execute({
      path_params: { job_id: 99999 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "転送ジョブID 99999 の詳細取得に失敗しました",
    );
  });
});
