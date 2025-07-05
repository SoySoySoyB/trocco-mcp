import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import { troccoRequest } from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetJobDetailInputSchema = z.object({
  job_id: z.number(),
});

export class GetJobDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_job_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO job details of specific job ID; ref https://documents.trocco.io/apidocs/get-job";

  /**
   * パラメータの定義
   */
  readonly parameters = GetJobDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetJobDetailInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/jobs/${input.job_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const job = await troccoRequest(url, apiKeyResult.apiKey, {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(job, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `転送ジョブID ${input.job_id} の詳細取得に失敗しました`,
      );
    }
  }
}
