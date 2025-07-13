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

const GetDatamartDefinitionsInputSchema = z
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
    query_params: z
      .object({
        name: z.string().optional(),
      })
      .optional(),
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

export class GetDatamartDefinitionsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_datamart_definitions";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO datamart definitions; ref https://documents.trocco.io/apidocs/get-datamart-definitions";

  /**
   * パラメータの定義
   */
  readonly parameters = GetDatamartDefinitionsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetDatamartDefinitionsInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = "/api/datamart_definitions";
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const options = {
        fetch_all: input.fetch_all,
        count: input.count,
        query_params: input.query_params,
      };
      const parsed_options = PaginationRequestOptionsInputSchema.parse(options);
      const datamart_definitions = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(datamart_definitions, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        "データマート定義一覧の取得に失敗しました",
      );
    }
  }
}
