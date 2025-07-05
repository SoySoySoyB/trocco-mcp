import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import { troccoRequest } from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetResourceGroupDetailInputSchema = z.object({
  resource_group_id: z.number(),
});

export class GetResourceGroupDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_resource_group_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO resource group details of specific resource group ID; ref https://documents.trocco.io/apidocs/get-resource-group";

  /**
   * パラメータの定義
   */
  readonly parameters = GetResourceGroupDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetResourceGroupDetailInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/resource_groups/${input.resource_group_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const resourceGroup = await troccoRequest(url, apiKeyResult.apiKey, {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(resourceGroup, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `リソースグループID ${input.resource_group_id} の詳細取得に失敗しました`,
      );
    }
  }
}
