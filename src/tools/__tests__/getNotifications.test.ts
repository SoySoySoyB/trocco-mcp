import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetNotificationsTool } from "../getNotifications.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetNotificationsTool", () => {
  const tool = new GetNotificationsTool();
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

  it("正常系: ツール名と説明が正しく設定されている", () => {
    expect(tool.name).toBe("trocco_get_notifications");
    expect(tool.description).toBe(
      "Get TROCCO notification destinations of specific notification type; ref https://documents.trocco.io/apidocs/get-notifications",
    );
  });

  it("正常系: 正しいAPIキーと有効なパラメータで、メール通知先一覧を取得できる", async () => {
    const mockResponse = [
      {
        id: 1,
        type: "email",
        email: "user1@example.com",
      },
      {
        id: 2,
        type: "email",
        email: "user2@example.com",
      },
    ];

    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue(mockResponse);

    const result = await tool.execute({
      path_params: { notification_type: "email" },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(2);
    expect(data[0].email).toBe("user1@example.com");

    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: 正しいAPIキーと有効なパラメータで、Slackチャンネル通知先一覧を取得できる", async () => {
    const mockResponse = [
      {
        id: 1,
        type: "slack_channel",
        channel: "#general",
      },
    ];

    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue(mockResponse);

    const result = await tool.execute({
      path_params: { notification_type: "slack_channel" },
      count: 10,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(1);
    expect(data[0].channel).toBe("#general");

    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: fetch_allパラメータを使用して、すべての通知先を取得できる", async () => {
    const mockResponse = [
      { id: 1, type: "email", email: "user1@example.com" },
      { id: 2, type: "email", email: "user2@example.com" },
      { id: 3, type: "email", email: "user3@example.com" },
    ];

    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue(mockResponse);

    const result = await tool.execute({
      path_params: { notification_type: "email" },
      fetch_all: true,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(3);

    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: レスポンスが空配列の場合でも正常に返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue([]);

    const result = await tool.execute({
      path_params: { notification_type: "slack_channel" },
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe("[]");
  });

  it("異常系: 無効な通知タイプを指定した場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({
        path_params: { notification_type: "invalid_type" },
      });
    }).toThrow();
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);

    const result = await tool.execute({
      path_params: { notification_type: "email" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("APIキーエラー");
  });

  it("異常系: troccoRequestWithPaginationで例外が発生した場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockRejectedValue(
      new Error("API connection failed"),
    );
    vi.mocked(createErrorResponse).mockReturnValue({
      content: [
        {
          type: "text",
          text: "emailの通知先一覧の取得に失敗しました: API connection failed",
        },
      ],
      isError: true,
    });

    const result = await tool.execute({
      path_params: { notification_type: "email" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      "emailの通知先一覧の取得に失敗しました",
    );

    expect(createErrorResponse).toHaveBeenCalledWith(
      expect.any(Error),
      "emailの通知先一覧の取得に失敗しました",
    );
  });

  it("異常系: countが0以下の場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({
        path_params: { notification_type: "email" },
        count: 0,
      });
    }).toThrow();
  });

  it("異常系: fetch_allがtrueでcountも指定された場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({
        path_params: { notification_type: "email" },
        fetch_all: true,
        count: 10,
      });
    }).toThrow();
  });
});
