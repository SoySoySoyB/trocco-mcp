import { z } from "zod";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");
const VERSION = pkg.version;

export const RequestOptionsInputSchema = z.object({
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
    .default("GET")
    .optional(),
  body: z.unknown().optional(),
  params: z
    .object({
      query_params: z.record(z.any()).optional(),
    })
    .optional(),
  fetch_all: z.boolean().optional(),
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
  const queryParams = options.params?.query_params ?? {};
  const searchParams = new URLSearchParams(queryParams);
  const urlWithParams = searchParams.toString()
    ? `${url}?${searchParams}`
    : url;
  const response = await fetch(urlWithParams, {
    method: options.method,
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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
  options: RequestOptions,
): Promise<Item[]> {
  const items: Item[] = [];
  let nextCursor: string | null = options.params?.query_params?.cursor || null;

  do {
    if (nextCursor) {
      if (!options.params) {
        options.params = {};
      }
      if (!options.params.query_params) {
        options.params.query_params = {};
      }
      options.params.query_params.cursor = nextCursor;
    }
    const data: PaginationResponse<Item> = await troccoRequest<
      PaginationResponse<Item>
    >(url, api_key, options);
    items.push(...data.items);
    nextCursor = data.next_cursor;

    if (!options.fetch_all) {
      break;
    }
  } while (nextCursor != null);
  return items;
}
