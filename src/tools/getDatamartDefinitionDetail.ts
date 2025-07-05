import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import { troccoRequest } from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetDatamartDefinitionDetailInputSchema = z.object({
  datamart_definition_id: z.number(),
});

export class GetDatamartDefinitionDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_datamart_definition_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO datamart definition details of specific datamart definition ID; ref https://documents.trocco.io/apidocs/get-datamart-definition";

  /**
   * パラメータの定義
   */
  readonly parameters = GetDatamartDefinitionDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetDatamartDefinitionDetailInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/datamart_definitions/${input.datamart_definition_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const datamartDefinition = await troccoRequest(
        url,
        apiKeyResult.apiKey,
        {},
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(datamartDefinition, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `データマート定義ID ${input.datamart_definition_id} の詳細取得に失敗しました`,
      );
    }
  }
}
