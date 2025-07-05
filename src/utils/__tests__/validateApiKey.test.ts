import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MCP_NAME } from "../../constants.js";
import { validateApiKey } from "../validateApiKey.js";

describe("validateApiKey", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("正常系：API_KEYが設定されている場合、APIキーを返す", () => {
    const testApiKey = "test-api-key";
    process.env[`${MCP_NAME.toUpperCase()}_API_KEY`] = testApiKey;
    const result = validateApiKey();
    expect(result.isInvalid).toBe(false);
    if (!result.isInvalid) {
      expect(result.apiKey).toBe(testApiKey);
    }
  });

  it("正常系：API_KEYが空白文字を含む場合、トリムされたAPIキーを返す", () => {
    const testApiKey = "  test-api-key  ";
    process.env[`${MCP_NAME.toUpperCase()}_API_KEY`] = testApiKey;
    const result = validateApiKey();
    expect(result.isInvalid).toBe(false);
    if (!result.isInvalid) {
      expect(result.apiKey).toBe(testApiKey.trim());
    }
  });

  it("異常系：API_KEYが設定されていない場合、エラーレスポンスを返す", () => {
    process.env[`${MCP_NAME.toUpperCase()}_API_KEY`] = undefined;
    const result = validateApiKey();
    expect(result.isInvalid).toBe(true);
    if (result.isInvalid) {
      expect(result.errorResponse.isError).toBe(true);
      expect(result.errorResponse.content[0].text).toContain(
        `${MCP_NAME.toUpperCase()}_API_KEYの設定が必要です`,
      );
    }
  });
});
