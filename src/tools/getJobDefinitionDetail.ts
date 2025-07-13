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

const GetJobDefinitionDetailInputSchema = z.object({
  path_params: z.object({
    job_definition_id: z.number(),
  }),
});

export class GetJobDefinitionDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_job_definition_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO job definition details of specific job definition ID; ref https://documents.trocco.io/apidocs/get-job-definition";

  /**
   * パラメータの定義
   */
  readonly parameters = GetJobDefinitionDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetJobDefinitionDetailInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/job_definitions/${input.path_params.job_definition_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const options = {};
      const parsed_options = RequestOptionsInputSchema.parse(options);
      const jobDefinition = await troccoRequest(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(jobDefinition, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `転送設定ID ${input.path_params.job_definition_id} の詳細取得に失敗しました`,
      );
    }
  }
}
