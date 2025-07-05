import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL, CONNECTION_TYPES } from "../constants.js";
import {
  troccoRequestWithPagination,
  RequestOptionsInputSchema,
} from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetConnectionConfigurationsInputSchema = z.object({
  connection_type: z
    .enum(CONNECTION_TYPES)
    .describe(
      `接続情報種別: ${CONNECTION_TYPES.join(", ")}のいずれかの値のみ指定可能`,
    ),
  fetch_all: z.boolean().default(false).optional(),
  limit: z.number().min(1).max(200).default(200).optional(),
});

export class GetConnectionConfigurationsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_connection_configurations";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO connection configurations of specific connection type; ref https://documents.trocco.io/apidocs/get-connection-configurations";

  /**
   * パラメータの定義
   */
  readonly parameters = GetConnectionConfigurationsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetConnectionConfigurationsInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/connections/${input.connection_type}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const { connection_type, fetch_all = false, ...query_params } = input;
      const input_options = {
        params: {
          query_params: query_params,
        },
        fetch_all: fetch_all,
      };
      const options = RequestOptionsInputSchema.parse(input_options);
      const connectionConfigurations = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(connectionConfigurations, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `${input.connection_type}の接続情報一覧の取得に失敗しました`,
      );
    }
  }
}
