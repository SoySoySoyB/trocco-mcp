import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import {
  troccoRequestWithPagination,
  PaginationRequestOptionsInputSchema,
} from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetResourceGroupsInputSchema = z
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
      const options = {
        fetch_all: input.fetch_all,
        count: input.count,
      };
      const parsed_options = PaginationRequestOptionsInputSchema.parse(options);
      const resource_groups = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        parsed_options,
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
