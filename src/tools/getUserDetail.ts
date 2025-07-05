import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import { troccoRequest } from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetUserDetailInputSchema = z.object({
  user_id: z.number(),
});

export class GetUserDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_user_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO user details of specific user ID; ref https://documents.trocco.io/apidocs/get-user";

  /**
   * パラメータの定義
   */
  readonly parameters = GetUserDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetUserDetailInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/users/${input.user_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const user = await troccoRequest(url, apiKeyResult.apiKey, {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(user, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `ユーザーID ${input.user_id} の詳細取得に失敗しました`,
      );
    }
  }
}
