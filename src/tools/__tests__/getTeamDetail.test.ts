import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetTeamDetailTool } from "../getTeamDetail.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequest } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetTeamDetailTool", () => {
  const tool = new GetTeamDetailTool();
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

  it("正常系: 正しいAPIキーと有効なチームIDでチーム詳細が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockResolvedValue({
      id: 10,
      name: "データ分析チーム",
      description: "データ分析を担当するチーム",
      member_count: 5,
    });
    const result = await tool.execute({
      path_params: { team_id: 10 },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("10");
    expect(result.content[0].text).toContain("データ分析チーム");
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({
      path_params: { team_id: 10 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("API失敗"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "チームID 10 の詳細取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({
      path_params: { team_id: 10 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "チームID 10 の詳細取得に失敗しました",
    );
  });

  it("異常系: 存在しないチームIDの場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("404 Not Found"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        { type: "text", text: "チームID 99999 の詳細取得に失敗しました" },
      ],
      isError: true,
    });
    const result = await tool.execute({
      path_params: { team_id: 99999 },
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "チームID 99999 の詳細取得に失敗しました",
    );
  });
});
