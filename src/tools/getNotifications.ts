import { z } from "zod";
import { IMCPTool } from "../index.js";
import { validateApiKey } from "../utils/validateApiKey.js";
import { BASE_URL, NOTIFICATION_TYPES } from "../constants.js";
import {
  troccoRequestWithPagination,
  PaginationRequestOptionsInputSchema,
} from "../utils/requestTROCCO.js";
import { createErrorResponse } from "../utils/createErrorResponse.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const GetNotificationsInputSchema = z
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
      notification_type: z
        .enum(NOTIFICATION_TYPES)
        .describe(
          `通知種別: ${NOTIFICATION_TYPES.join(", ")}のいずれかの値のみ指定可能`,
        ),
    }),
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

export class GetNotificationsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "trocco_get_notifications";

  /**
   * ツールの説明
   */
  readonly description =
    "Get TROCCO notification destinations of specific notification type; ref https://documents.trocco.io/apidocs/get-notifications";

  /**
   * パラメータの定義
   */
  readonly parameters = GetNotificationsInputSchema;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  async execute(input: z.infer<typeof GetNotificationsInputSchema>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    const path = `/api/notification_destinations/${input.path_params.notification_type}`;
    const url = `${BASE_URL}${path}`;
    const apiKeyResult = validateApiKey();
    if (apiKeyResult.isInvalid) {
      return apiKeyResult.errorResponse;
    }
    try {
      const api_limit = 50; // getNotificationsのAPI制限値
      const options = {
        fetch_all: input.fetch_all,
        count: input.count,
        api_limit: api_limit,
      };
      const parsed_options = PaginationRequestOptionsInputSchema.parse(options);
      const notifications = await troccoRequestWithPagination(
        url,
        apiKeyResult.apiKey,
        parsed_options,
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(notifications, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `${input.path_params.notification_type}の通知先一覧の取得に失敗しました`,
      );
    }
  }
}
