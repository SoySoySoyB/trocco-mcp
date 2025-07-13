import { z } from "zod";
import { createRequire } from "module";
import { DEFAULT_API_LIMIT } from "../constants.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");
const VERSION = pkg.version;

export const RequestOptionsInputSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  query_params: z.record(z.any()).optional(),
  body_params: z.record(z.any()).optional(),
});

type RequestOptions = z.infer<typeof RequestOptionsInputSchema>;

/**
 * TROCCO APIへのリクエストを送信する
 * @param url リクエストURL
 * @param api_key APIキー
 * @param options リクエストオプション
 * @returns APIレスポンス
 */
export async function troccoRequest<T>(
  url: string,
  api_key: string,
  options: RequestOptions,
): Promise<T> {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": `ds-trocco-mcp/${VERSION}`,
    Authorization: `Token ${api_key}`,
  };
  const queryParams = options.query_params ?? {};
  const searchParams = new URLSearchParams(queryParams);
  const urlWithParams = searchParams.toString()
    ? `${url}?${searchParams}`
    : url;
  const response = await fetch(urlWithParams, {
    method: options.method,
    headers: headers,
    body: options.body_params ? JSON.stringify(options.body_params) : undefined,
  });
  if (!response.ok) {
    let errorDetails = "";
    try {
      const errorBody = await response.text();
      const errorJson = JSON.parse(errorBody);
      errorDetails = errorJson.message || errorJson.error || errorBody;
    } catch {
      errorDetails = `HTTP ${response.status} ${response.statusText}`;
    }

    throw new Error(
      `TROCCO APIのリクエストが失敗しました: ${errorDetails}\n` +
        `URL: ${urlWithParams}\n` +
        `Method: ${options.method}\n` +
        `Status: ${response.status}`,
    );
  }
  return await response.json();
}

export const PaginationRequestOptionsInputSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  api_limit: z.number().default(DEFAULT_API_LIMIT),
  fetch_all: z.boolean().default(false),
  count: z.number().optional(),
  query_params: z.record(z.any()).optional(),
  body_params: z.record(z.any()).optional(),
});

type PaginationRequestOptions = z.infer<
  typeof PaginationRequestOptionsInputSchema
>;

type PaginationResponse<Item> = {
  items: Item[];
  next_cursor: string | null;
};

/**
 * ページネーション対応のTROCCO APIリクエストを送信する
 * @param url リクエストURL
 * @param api_key APIキー
 * @param options リクエストオプション
 * @returns 全てのアイテムを含む配列
 */
export async function troccoRequestWithPagination<Item>(
  url: string,
  api_key: string,
  options: PaginationRequestOptions,
): Promise<Item[]> {
  const items: Item[] = [];
  const apiLimit = options.api_limit;
  let nextCursor: string | null = null;

  if (options.fetch_all) {
    do {
      if (nextCursor) {
        if (!options.query_params) {
          options.query_params = {};
        }
        options.query_params.cursor = nextCursor;
      }

      if (!options.query_params) {
        options.query_params = {};
      }
      options.query_params.limit = apiLimit;
      let parsed_options = RequestOptionsInputSchema.parse(options);

      const data: PaginationResponse<Item> = await troccoRequest<
        PaginationResponse<Item>
      >(url, api_key, parsed_options);
      items.push(...data.items);
      nextCursor = data.next_cursor;
    } while (nextCursor != null);
  } else if (options.count) {
    const targetCount = options.count;

    do {
      if (nextCursor) {
        if (!options.query_params) {
          options.query_params = {};
        }
        options.query_params.cursor = nextCursor;
      }

      const remainingCount = targetCount - items.length;
      const currentLimit = Math.min(remainingCount, apiLimit!);

      if (!options.query_params) {
        options.query_params = {};
      }
      options.query_params.limit = currentLimit;
      let parsed_options = RequestOptionsInputSchema.parse(options);

      const data: PaginationResponse<Item> = await troccoRequest<
        PaginationResponse<Item>
      >(url, api_key, parsed_options);
      items.push(...data.items);
      nextCursor = data.next_cursor;

      if (items.length >= targetCount) {
        break;
      }
    } while (nextCursor != null);
  } else {
    if (!options.query_params) {
      options.query_params = {};
    }
    options.query_params.limit = apiLimit;
    let parsed_options = RequestOptionsInputSchema.parse(options);

    const data: PaginationResponse<Item> = await troccoRequest<
      PaginationResponse<Item>
    >(url, api_key, parsed_options);
    items.push(...data.items);
  }

  return items;
}
