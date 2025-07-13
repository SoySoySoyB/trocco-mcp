import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL, CONNECTION_TYPES } from "../constants.js";
import {
  troccoRequestWithPagination,
  PaginationRequestOptionsInputSchema,
} from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetConnectionConfigurationsInputSchema = z
  .object({
    fetch_all: z
      .boolean()
      .default(false)
      .optional()
      .describe("全件取得フラグ: trueの場合、countは指定不可"),
    count: z
      .number()
      .min(1)
      .optional()
      .describe("取得したいアイテム数: fetch_allがtrueの場合は指定不可"),
    path_params: z.object({
      connection_type: z
        .enum(CONNECTION_TYPES)
        .describe(
          `接続情報種別: ${CONNECTION_TYPES.join(", ")}のいずれかの値のみ指定可能`,
        ),
    }),
  })
  .refine(
    (data) => {
      return !(data.fetch_all === true && data.count !== undefined);
    },
    {
      message:
        "fetch_allがtrueの場合、countを同時に指定することはできません。いずれか一方を指定してください。",
    },
  );

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
    const path = `/api/connections/${input.path_params.connection_type}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const input_options = {
        fetch_all: input.fetch_all,
        count: input.count,
      };
      const options = PaginationRequestOptionsInputSchema.parse(input_options);
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
        `${input.path_params.connection_type}の接続情報一覧の取得に失敗しました`,
      );
    }
  }
}
