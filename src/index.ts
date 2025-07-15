import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createRequire } from "module";
import { MCP_NAME } from "./constants.js";
import { GetConnectionConfigurationDetailTool } from "./tools/getConnectionConfigurationDetail.js";
import { GetConnectionConfigurationsTool } from "./tools/getConnectionConfigurations.js";
import { GetDatamartDefinitionDetailTool } from "./tools/getDatamartDefinitionDetail.js";
import { GetDatamartDefinitionsTool } from "./tools/getDatamartDefinitions.js";
import { GetJobDefinitionDetailTool } from "./tools/getJobDefinitionDetail.js";
import { GetJobDefinitionsTool } from "./tools/getJobDefinitions.js";
import { GetJobDetailTool } from "./tools/getJobDetail.js";
import { GetJobsTool } from "./tools/getJobs.js";
import { GetLabelDetailTool } from "./tools/getLabelDetail.js";
import { GetLabelsTool } from "./tools/getLabels.js";
import { GetNotificationsTool } from "./tools/getNotifications.js";
import { GetPipelineDefinitionDetailTool } from "./tools/getPipelineDefinitionDetail.js";
import { GetPipelineDefinitionsTool } from "./tools/getPipelineDefinitions.js";
import { GetPipelineJobDetailTool } from "./tools/getPipelineJobDetail.js";
import { GetResourceGroupDetailTool } from "./tools/getResourceGroupDetail.js";
import { GetResourceGroupsTool } from "./tools/getResourceGroups.js";
import { GetTeamDetailTool } from "./tools/getTeamDetail.js";
import { GetTeamsTool } from "./tools/getTeams.js";
import { GetUserDetailTool } from "./tools/getUserDetail.js";
import { GetUsersTool } from "./tools/getUsers.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const VERSION = pkg.version;

export interface IMCPTool<TParams = any> {
  /**
   * ツール名
   */
  readonly name: string;

  /**
   * ツールの説明
   */
  readonly description: string;

  /**
   * パラメータの定義
   */
  readonly parameters: TParams;

  /**
   * ツールを実行する
   * @param input 入力値
   * @returns 実行結果
   */
  execute(input: TParams): Promise<{
    content: TextContent[];
    isError?: boolean;
  }>;
}

const TOOLS: IMCPTool[] = [
  new GetConnectionConfigurationDetailTool(),
  new GetConnectionConfigurationsTool(),
  new GetDatamartDefinitionDetailTool(),
  new GetDatamartDefinitionsTool(),
  new GetJobDefinitionDetailTool(),
  new GetJobDefinitionsTool(),
  new GetJobDetailTool(),
  new GetJobsTool(),
  new GetLabelDetailTool(),
  new GetLabelsTool(),
  new GetNotificationsTool(),
  new GetPipelineDefinitionDetailTool(),
  new GetPipelineDefinitionsTool(),
  new GetPipelineJobDetailTool(),
  new GetResourceGroupDetailTool(),
  new GetResourceGroupsTool(),
  new GetTeamDetailTool(),
  new GetTeamsTool(),
  new GetUserDetailTool(),
  new GetUsersTool(),
];

const server = new Server(
  {
    name: MCP_NAME,
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.parameters),
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = TOOLS.find((t) => t.name === request.params.name);
  if (!tool) {
    throw new Error(
      "ツールが見つかりません。指定されたツール名: " + request.params.name,
    );
  }
  const input = tool.parameters.parse(request.params.arguments);
  return tool.execute(input);
});

const transport = new StdioServerTransport();
await server.connect(transport);
