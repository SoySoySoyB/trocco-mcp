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

const GetLabelsInputSchema = z
  .object({
    fetch_all: z.boolean().default(false).optional(),
    limit: z.number().min(1).max(200).default(200).optional(),
    job_definition_id: z
      .number()
      .optional()
      .describe(
        "転送設定のID; 他のID指定パラメータと同時に指定することはできません",
      ),
    job_definition_bulk_id: z
      .number()
      .optional()
      .describe(
        "マネージド転送設定のID; 他のID指定パラメータと同時に指定することはできません",
      ),
    datamart_definition_id: z
      .number()
      .optional()
      .describe(
        "データマート定義のID; 他のID指定パラメータと同時に指定することはできません",
      ),
    pipeline_definition_id: z
      .number()
      .optional()
      .describe(
        "ワークフロー定義のID; 他のID指定パラメータと同時に指定することはできません",
      ),
  })
  .refine(
    /* c8 ignore start */
    (data) => {
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
      const { fetch_all = false, ...query_params } = input;
      const input_options = {
        params: {
          query_params: query_params,
        },
        fetch_all: fetch_all,
      };
      const options = RequestOptionsInputSchema.parse(input_options);
      const labels = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        options,
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
