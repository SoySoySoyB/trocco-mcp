import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetResourceGroupDetailTool } from "../getResourceGroupDetail.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequest } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetResourceGroupDetailTool", () => {
  const tool = new GetResourceGroupDetailTool();
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

  it("正常系: 正しいAPIキーと有効なリソースグループIDでリソースグループ詳細が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockResolvedValue({
      id: 20,
      name: "本番環境リソース",
      description: "本番環境で使用するリソースグループ",
      resource_count: 10,
    });
    const result = await tool.execute({ resource_group_id: 20 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("20");
    expect(result.content[0].text).toContain("本番環境リソース");
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({ resource_group_id: 20 });
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
          text: "リソースグループID 20 の詳細取得に失敗しました",
        },
      ],
      isError: true,
    });
    const result = await tool.execute({ resource_group_id: 20 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "リソースグループID 20 の詳細取得に失敗しました",
    );
  });

  it("異常系: 存在しないリソースグループIDの場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("404 Not Found"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        {
          type: "text",
          text: "リソースグループID 99999 の詳細取得に失敗しました",
        },
      ],
      isError: true,
    });
    const result = await tool.execute({ resource_group_id: 99999 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "リソースグループID 99999 の詳細取得に失敗しました",
    );
  });
});
