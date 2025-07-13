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

const GetLabelsInputSchema = z
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
        job_definition_id: z
          .number()
          .optional()
          .describe("転送設定のID: 他のID指定パラメータと同時に指定は不可能"),
        job_definition_bulk_id: z
          .number()
          .optional()
          .describe(
            "マネージド転送設定のID: 他のID指定パラメータと同時に指定は不可能",
          ),
        datamart_definition_id: z
          .number()
          .optional()
          .describe(
            "データマート定義のID: 他のID指定パラメータと同時に指定は不可能",
          ),
        pipeline_definition_id: z
          .number()
          .optional()
          .describe(
            "ワークフロー定義のID: 他のID指定パラメータと同時に指定は不可能",
          ),
      })
      .optional()
      .refine(
        /* c8 ignore start */
        (data) => {
          if (!data) return true;
          const idFields = [
            data.job_definition_id,
            data.job_definition_bulk_id,
            data.datamart_definition_id,
            data.pipeline_definition_id,
          ];
          const definedIds = idFields.filter((id) => id !== undefined);
          return definedIds.length <= 1;
        },
        /* c8 ignore stop */
        {
          message:
            "複数のIDパラメータを同時に指定することはできません。job_definition_id、job_definition_bulk_id、datamart_definition_id、pipeline_definition_idのうち1つのみを指定してください。",
        },
      ),
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

export class GetLabelsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_labels";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO labels; ref https://documents.trocco.io/apidocs/get-labels";

  /**
   * パラメータの定義
   */
  readonly parameters = GetLabelsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetLabelsInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = "/api/labels";
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
      const labels = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(labels, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "ラベル一覧の取得に失敗しました");
    }
  }
}
