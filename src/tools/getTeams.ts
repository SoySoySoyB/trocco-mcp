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

const GetTeamsInputSchema = z
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

export class GetTeamsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_teams";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO teams; ref https://documents.trocco.io/apidocs/get-teams";

  /**
   * パラメータの定義
   */
  readonly parameters = GetTeamsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetTeamsInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = "/api/teams";
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
      const teams = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(teams, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "チーム一覧の取得に失敗しました");
    }
  }
}
