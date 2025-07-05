import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import {
  troccoRequestWithPagination,
  RequestOptionsInputSchema,
} from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetResourceGroupsInputSchema = z.object({
  fetch_all: z.boolean().default(false).optional(),
  limit: z.number().min(1).max(200).default(200).optional(),
});

export class GetResourceGroupsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_resource_groups";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO resource groups; ref https://documents.trocco.io/apidocs/get-resource-groups";

  /**
   * パラメータの定義
   */
  readonly parameters = GetResourceGroupsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetResourceGroupsInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = "/api/resource_groups";
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const { fetch_all = false, ...query_params } = input;
      const input_options = {
        params: {
          query_params: query_params,
        },
        fetch_all: fetch_all,
      };
      const options = RequestOptionsInputSchema.parse(input_options);
      const resource_groups = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(resource_groups, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        "リソースグループ一覧の取得に失敗しました",
      );
    }
  }
}
