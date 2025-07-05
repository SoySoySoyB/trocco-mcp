export const MCP_NAME = "trocco";
export const BASE_URL = "https://trocco.io";

export const CONNECTION_TYPES = [
  "athena",
  "bigquery",
  "gcs",
  "google_spreadsheets",
  "snowflake",
  "mysql",
  "s3",
  "salesforce",
  "postgresql",
  "google_analytics4",
  "kintone",
] as const;

export const NOTIFICATION_TYPES = ["email", "slack_channel"] as const;
