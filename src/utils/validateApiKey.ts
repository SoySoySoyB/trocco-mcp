import { createErrorResponse } from "./createErrorResponse.js";
import { MCP_NAME } from "../constants.js";

/**
 * APIキーの検証を行う関数
 * @returns 有効なAPIキーがある場合はAPIキーを、ない場合はエラーレスポンスを返す
 */
export function validateApiKey():
  | { apiKey: string; isInvalid: false }
  | {
      errorResponse: ReturnType<typeof createErrorResponse>;
      isInvalid: true;
    } {
  const api_key = process.env[`${MCP_NAME.toUpperCase()}_API_KEY`]?.trim();
  if (!api_key) {
    return {
      errorResponse: createErrorResponse(
        new Error(`${MCP_NAME.toUpperCase()}_API_KEY is required`),
        `${MCP_NAME.toUpperCase()}_API_KEYの設定が必要です。環境変数に設定してください。`,
      ),
      isInvalid: true,
    };
  }
  return { apiKey: api_key, isInvalid: false };
}
