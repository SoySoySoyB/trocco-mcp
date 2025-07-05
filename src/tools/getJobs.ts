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

const GetJobsInputSchema = z.object({
  fetch_all: z.boolean().default(false).optional(),
  job_definition_id: z.number(),
  start_time: z
    .string()
    .optional()
    .describe("転送ジョブ作成日時; YYYY-MM-DD HH:MM:SS形式で指定"),
  end_time: z
    .string()
    .optional()
    .describe("転送ジョブ終了日時; YYYY-MM-DD HH:MM:SS形式で指定"),
  time_zone: z.string().default("Asia/Tokyo").optional(),
  limit: z.number().min(1).max(100).default(100).optional(),
});

export class GetJobsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_jobs";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO jobs of specific job definition; ref https://documents.trocco.io/apidocs/get-jobs";

  /**
   * パラメータの定義
   */
  readonly parameters = GetJobsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetJobsInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/job_definitions/${input.job_definition_id}/jobs`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const { job_definition_id, fetch_all = false, ...query_params } = input;
      const input_options = {
        params: {
          query_params: query_params,
        },
        fetch_all: fetch_all,
      };
      const options = RequestOptionsInputSchema.parse(input_options);
      const jobs = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(jobs, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "転送ジョブ一覧の取得に失敗しました");
    }
  }
}
