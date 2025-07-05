import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetConnectionConfigurationsTool } from "../getConnectionConfigurations.js";
import { validateApiKey } from "../../utils/validateApiKey.js";
import { troccoRequestWithPagination } from "../../utils/requestTROCCO.js";
import { createErrorResponse } from "../../utils/createErrorResponse.js";

vi.mock("../../utils/validateApiKey");
vi.mock("../../utils/requestTROCCO");
vi.mock("../../utils/createErrorResponse");

describe("GetConnectionConfigurationsTool", () => {
  const tool = new GetConnectionConfigurationsTool();
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
    expect(tool.name).toBe("trocco_get_connection_configurations");
    expect(tool.description).toBe(
      "Get TROCCO connection configurations of specific connection type; ref https://documents.trocco.io/apidocs/get-connection-configurations",
    );
  });

  it("正常系: 正しいAPIキーと有効なパラメータで、BigQueryの接続情報一覧を取得できる", async () => {
    const mockResponse = [
      {
        id: 1,
        name: "BigQuery Production",
        description: "本番環境のBigQuery接続",
      },
      {
        id: 2,
        name: "BigQuery Staging",
        description: "ステージング環境のBigQuery接続",
      },
    ];

    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue(mockResponse);

    const result = await tool.execute({ connection_type: "bigquery" });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("BigQuery Production");

    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: 正しいAPIキーと有効なパラメータで、S3の接続情報一覧を取得できる", async () => {
    const mockResponse = [
      {
        id: 1,
        name: "S3 Data Lake",
        description: "データレイク用S3バケット",
      },
    ];

    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue(mockResponse);

    const result = await tool.execute({
      connection_type: "s3",
      limit: 10,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("S3 Data Lake");

    expect(troccoRequestWithPagination).toHaveBeenCalled();
  });

  it("正常系: fetch_allパラメータを使用して、すべての接続情報を取得できる", async () => {
    const mockResponse = [
      { id: 1, name: "MySQL DB1" },
      { id: 2, name: "MySQL DB2" },
      { id: 3, name: "MySQL DB3" },
    ];

    vi.mocked(validateApiKey).mockReturnValue(validApiKeyResult);
    vi.mocked(troccoRequestWithPagination).mockResolvedValue(mockResponse);

    const result = await tool.execute({
      connection_type: "mysql",
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

    const result = await tool.execute({ connection_type: "snowflake" });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe("[]");
  });

  it("異常系: 無効な接続タイプを指定した場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({ connection_type: "invalid_type" });
    }).toThrow();
  });

  it("異常系: APIキーが無効な場合、エラーレスポンスが返る", async () => {
    vi.mocked(validateApiKey).mockReturnValue(invalidApiKeyResult);

    const result = await tool.execute({ connection_type: "bigquery" });

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
          text: "snowflakeの接続情報一覧の取得に失敗しました: API connection failed",
        },
      ],
      isError: true,
    });

    const result = await tool.execute({ connection_type: "snowflake" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      "snowflakeの接続情報一覧の取得に失敗しました",
    );

    expect(createErrorResponse).toHaveBeenCalledWith(
      expect.any(Error),
      "snowflakeの接続情報一覧の取得に失敗しました",
    );
  });

  it("異常系: limitが範囲外の場合、バリデーションエラーが発生する", () => {
    expect(() => {
      tool.parameters.parse({ connection_type: "bigquery", limit: 0 });
    }).toThrow();

    expect(() => {
      tool.parameters.parse({ connection_type: "bigquery", limit: 201 });
    }).toThrow();
  });
});
