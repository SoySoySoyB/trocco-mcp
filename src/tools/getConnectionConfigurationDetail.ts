import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL, CONNECTION_TYPES } from "../constants.js";
import { troccoRequest } from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetConnectionConfigurationDetailInputSchema = z.object({
  connection_type: z
    .enum(CONNECTION_TYPES)
    .describe(
      `接続情報種別: ${CONNECTION_TYPES.join(", ")}のいずれかの値のみ指定可能`,
    ),
  connection_id: z.number(),
});

export class GetConnectionConfigurationDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_connection_configuration_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO connection configuration details of specific connection type and ID; ref https://documents.trocco.io/apidocs/get-connection-configuration";

  /**
   * パラメータの定義
   */
  readonly parameters = GetConnectionConfigurationDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetConnectionConfigurationDetailInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/connections/${input.connection_type}/${input.connection_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const connectionConfiguration = await troccoRequest(
        url,
        apiKeyResult.apiKey,
        {},
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(connectionConfiguration, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `接続情報ID ${input.connection_id} (${input.connection_type}) の詳細取得に失敗しました`,
      );
    }
  }
}
