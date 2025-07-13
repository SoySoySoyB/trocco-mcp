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

const GetPipelineJobDetailInputSchema = z.object({
  path_params: z.object({
    pipeline_job_id: z.number(),
  }),
});

export class GetPipelineJobDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_pipeline_job_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO pipeline job details of specific pipeline job ID; ref https://documents.trocco.io/apidocs/get-pipeline-job";

  /**
   * パラメータの定義
   */
  readonly parameters = GetPipelineJobDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetPipelineJobDetailInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/pipeline_jobs/${input.path_params.pipeline_job_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const options = {};
      const parsed_options = RequestOptionsInputSchema.parse(options);
      const pipelineJob = await troccoRequest(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(pipelineJob, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `ワークフロージョブID ${input.path_params.pipeline_job_id} の詳細取得に失敗しました`,
      );
    }
  }
}
