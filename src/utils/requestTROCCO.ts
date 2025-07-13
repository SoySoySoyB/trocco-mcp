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
 * 1ページ分のデータを取得する
 * @param url リクエストURL
 * @param api_key APIキー
 * @param options リクエストオプション
 * @param cursor ページネーションカーソル
 * @param limit 取得件数
 * @returns ページネーションレスポンス
 */
async function fetchPage<Item>(
  url: string,
  api_key: string,
  options: PaginationRequestOptions,
  cursor: string | null,
  limit: number,
): Promise<PaginationResponse<Item>> {
  const base = options.query_params ?? {};
  const query_params = {
    ...base,
    ...(cursor && { cursor }),
    limit,
  };
  const parsed_options = RequestOptionsInputSchema.parse({
    method: options.method,
    body_params: options.body_params,
    query_params,
  });
  return await troccoRequest<PaginationResponse<Item>>(
    url,
    api_key,
    parsed_options,
  );
}

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
      const data: PaginationResponse<Item> = await fetchPage<Item>(
        url,
        api_key,
        options,
        nextCursor,
        apiLimit,
      );
      items.push(...data.items);
      nextCursor = data.next_cursor;
    } while (nextCursor != null);
  } else if (options.count) {
    const targetCount = options.count;
    do {
      const limit = Math.min(targetCount - items.length, apiLimit);
      const data: PaginationResponse<Item> = await fetchPage<Item>(
        url,
        api_key,
        options,
        nextCursor,
        limit,
      );
      items.push(...data.items);
      nextCursor = data.next_cursor;
    } while (nextCursor != null && items.length < targetCount);
  } else {
    const data: PaginationResponse<Item> = await fetchPage<Item>(
      url,
      api_key,
      options,
      null,
      apiLimit,
    );
    items.push(...data.items);
  }

  return items;
}
