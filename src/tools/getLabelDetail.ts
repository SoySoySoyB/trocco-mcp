import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import {
  troccoRequest,
  RequestOptionsInputSchema,
} from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetLabelDetailInputSchema = z.object({
  path_params: z.object({
    label_id: z.number(),
  }),
});

export class GetLabelDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_label_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO label details of specific label ID; ref https://documents.trocco.io/apidocs/get-label";

  /**
   * パラメータの定義
   */
  readonly parameters = GetLabelDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetLabelDetailInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/labels/${input.path_params.label_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const options = {};
      const parsed_options = RequestOptionsInputSchema.parse(options);
      const label = await troccoRequest(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(label, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `ラベルID ${input.path_params.label_id} の詳細取得に失敗しました`,
      );
    }
  }
}
