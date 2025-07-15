# MCP Server for TROCCO

TROCCO のリソースを MCP 経由で操作するためのサーバー

## ビルド

```shell
npm install
npm run build
```

## 環境設定

### API キーの設定

TROCCO API を使用するには、環境変数 `TROCCO_API_KEY` の設定が必要です。

#### 方法 1: 環境変数として設定

```bash
export TROCCO_API_KEY="your-api-key-here"
```

#### 方法 2: MCP 設定ファイル

MCP 設定ファイルに以下のように設定：

```json
{
  "servers": {
    "trocco": {
      "command": "node",
      "args": ["path/to/trocco-mcp/dist/index.js"],
      "env": {
        "TROCCO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### API キーの取得方法

1. [TROCCO](https://trocco.io) にログイン
2. 外部連携 > TROCCO API KEY に移動
3. 新規 API キーを作成

### 注意事項

MCP 用にユーザーを新規で作成する、チーム機能で付与する権限を限定するなど、セキュリティを考慮した設定を行ってください。

## 利用可能なツール

### パラメータについて

- `fetch_all`: 全件取得フラグ（デフォルト: false）
- `count`: 取得件数の指定（デフォルト: APIごとの制限値）
- **注意**: `fetch_all=true` と `count` は同時に指定できません

### ユーザー

| ツール名                 | 説明                 | パラメータ           |
| ------------------------ | -------------------- | -------------------- |
| `trocco_get_users`       | ユーザー一覧を取得   | `fetch_all`, `count` |
| `trocco_get_user_detail` | 個別のユーザーを取得 | `user_id` (必須)     |

### チーム

| ツール名                 | 説明               | パラメータ           |
| ------------------------ | ------------------ | -------------------- |
| `trocco_get_teams`       | チーム一覧を取得   | `fetch_all`, `count` |
| `trocco_get_team_detail` | 個別のチームを取得 | `team_id` (必須)     |

### リソースグループ

| ツール名                           | 説明                         | パラメータ                 |
| ---------------------------------- | ---------------------------- | -------------------------- |
| `trocco_get_resource_groups`       | リソースグループ一覧を取得   | `fetch_all`, `count`       |
| `trocco_get_resource_group_detail` | 個別のリソースグループを取得 | `resource_group_id` (必須) |

### ラベル

| ツール名                  | 説明               | パラメータ                                                                                                              |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `trocco_get_labels`       | ラベル一覧を取得   | `fetch_all`, `count`, `job_definition_id`, `job_definition_bulk_id`, `datamart_definition_id`, `pipeline_definition_id` |
| `trocco_get_label_detail` | 個別のラベルを取得 | `label_id` (必須)                                                                                                       |

### 通知先

| ツール名                   | 説明             | パラメータ                                       |
| -------------------------- | ---------------- | ------------------------------------------------ |
| `trocco_get_notifications` | 通知先一覧を取得 | `notification_type` (必須), `fetch_all`, `count` |

### 接続情報

| ツール名                                     | 説明                 | パラメータ                                       |
| -------------------------------------------- | -------------------- | ------------------------------------------------ |
| `trocco_get_connection_configurations`       | 接続情報一覧を取得   | `connection_type` (必須), `fetch_all`, `count`   |
| `trocco_get_connection_configuration_detail` | 個別の接続設定を取得 | `connection_type` (必須), `connection_id` (必須) |

### 転送設定

| ツール名                           | 説明                               | パラメータ                                                                              |
| ---------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| `trocco_get_job_definitions`       | ジョブ定義一覧を取得               | `fetch_all`, `count`, `name`                                                            |
| `trocco_get_job_definition_detail` | 個別のジョブ定義を取得             | `job_definition_id` (必須)                                                              |
| `trocco_get_jobs`                  | 特定のジョブ定義のジョブ一覧を取得 | `job_definition_id` (必須), `fetch_all`, `count`, `start_time`, `end_time`, `time_zone` |
| `trocco_get_job_detail`            | 個別のジョブ実行結果を取得         | `job_id` (必須)                                                                         |

### データマート定義

| ツール名                                | 説明                         | パラメータ                      |
| --------------------------------------- | ---------------------------- | ------------------------------- |
| `trocco_get_datamart_definitions`       | データマート定義一覧を取得   | `fetch_all`, `count`, `name`    |
| `trocco_get_datamart_definition_detail` | 個別のデータマート定義を取得 | `datamart_definition_id` (必須) |

### ワークフロー定義

| ツール名                                | 説明                           | パラメータ                      |
| --------------------------------------- | ------------------------------ | ------------------------------- |
| `trocco_get_pipeline_definitions`       | ワークフロー一覧を取得         | `fetch_all`, `count`            |
| `trocco_get_pipeline_definition_detail` | 個別のワークフロー定義を取得   | `pipeline_definition_id` (必須) |
| `trocco_get_pipeline_job_detail`        | 個別のパイプラインジョブを取得 | `pipeline_job_id` (必須)        |

## 開発

### テスト実行

```shell
# 全テストを実行（カバレッジレポートを生成・更新）
npm test

# 特定ファイルのテストを実行（カバレッジレポートの生成はなし）
npm run test:file -- getLabels.test.ts

# ウォッチモード（ファイル変更時に自動でテスト実行、カバレッジレポートの生成はなし）
npm run test:watch
```

`npm test` 実行時のみカバレッジレポートが生成・更新され、`coverage/index.html` で確認できます。
`test:watch` は開発中にファイルを保存すると自動的に関連するテストを再実行します。

### 型チェック

```shell
npm run build
```

### バージョン管理

セマンティックバージョニングに従ってバージョンを更新：

```shell
# パッチバージョン更新 (例: 0.1.0 → 0.1.1)
npm run version:patch

# マイナーバージョン更新 (例: 0.1.0 → 0.2.0)
npm run version:minor

# メジャーバージョン更新 (例: 0.1.0 → 1.0.0)
npm run version:major
```

バージョンは package.json から自動的に読み込まれるため、package.json のみを更新すれば完了です。
