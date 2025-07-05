import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL } from "../constants.js";
import { troccoRequest } from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetPipelineDefinitionDetailInputSchema = z.object({
  pipeline_definition_id: z.number(),
});

export class GetPipelineDefinitionDetailTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_pipeline_definition_detail";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO pipeline definition details of specific pipeline definition ID; ref https://documents.trocco.io/apidocs/get-pipeline-definition";

  /**
   * パラメータの定義
   */
  readonly parameters = GetPipelineDefinitionDetailInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(
    input: z.infer<typeof GetPipelineDefinitionDetailInputSchema>,
  ): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/pipeline_definitions/${input.pipeline_definition_id}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const pipelineDefinition = await troccoRequest(
        url,
        apiKeyResult.apiKey,
        {},
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(pipelineDefinition, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `ワークフロー定義ID ${input.pipeline_definition_id} の詳細取得に失敗しました`,
      );
    }
  }
}
