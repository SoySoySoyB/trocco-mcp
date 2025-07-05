import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetLabelDetailTool } from "../getLabelDetail.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequest } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetLabelDetailTool", () => {
  const tool = new GetLabelDetailTool();
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

  it("正常系: 正しいAPIキーと有効なラベルIDでラベル詳細が取得できる", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockResolvedValue({
      id: 5,
      name: "重要",
      color: "#FF0000",
      description: "重要なリソースを示すラベル",
    });
    const result = await tool.execute({ label_id: 5 });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("5");
    expect(result.content[0].text).toContain("重要");
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);
    const result = await tool.execute({ label_id: 5 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain("APIキーエラー");
  });

  it("異常系: troccoRequestで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("API失敗"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [{ type: "text", text: "ラベルID 5 の詳細取得に失敗しました" }],
      isError: true,
    });
    const result = await tool.execute({ label_id: 5 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "ラベルID 5 の詳細取得に失敗しました",
    );
  });

  it("異常系: 存在しないラベルIDの場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequest).mockRejectedValue(new Error("404 Not Found"));
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        { type: "text", text: "ラベルID 99999 の詳細取得に失敗しました" },
      ],
      isError: true,
    });
    const result = await tool.execute({ label_id: 99999 });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain(
      "ラベルID 99999 の詳細取得に失敗しました",
    );
  });
});
