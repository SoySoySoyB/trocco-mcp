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

const GetJobsInputSchema = z
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
    path_params: z.object({
      job_definition_id: z.number(),
    }),
    query_params: z
      .object({
        start_time: z
          .string()
          .optional()
          .describe("転送ジョブ作成日時: YYYY-MM-DD HH:MM:SS形式で指定"),
        end_time: z
          .string()
          .optional()
          .describe("転送ジョブ終了日時: YYYY-MM-DD HH:MM:SS形式で指定"),
        time_zone: z.string().default("Asia/Tokyo").optional(),
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
    const path = `/api/job_definitions/${input.path_params.job_definition_id}/jobs`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const api_limit = 100; // getJobsのAPI制限値
      const options = {
        api_limit: api_limit,
        fetch_all: input.fetch_all,
        count: input.count,
        query_params: input.query_params,
      };
      const parsed_options = PaginationRequestOptionsInputSchema.parse(options);
      const jobs = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        parsed_options,
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
