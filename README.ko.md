# @byul/mcp

최신 Model Context Protocol (MCP) 사양을 준수합니다.

## 링크 (Links)

- [API 문서](https://www.byul.ai/api)
- [API 가격](https://www.byul.ai/api/pricing)
- [개발자 문서](https://docs.byul.ai/)
- [API 상태](https://www.byul.ai/api/status)

## 개요 (Overview)

`@byul/mcp`는 stdio 기반 MCP 서버로, Byul REST API를 프록시합니다. MCP 도구와 리소스를 통해 Byul 엔드포인트를 호출하고, 원본 JSON에 더해 기사 개수 요약 문자열을 함께 반환합니다.

## 요구사항 (Requirements)

- Node.js 18+
- `BYUL_API_KEY` 환경변수

## 빠른 시작 (Quick start)

```bash
BYUL_API_KEY=byul_xxxxxxxxxxxxx npx -y @byul/mcp
```

## 구성 (Configuration)

LLM 클라이언트에 MCP 서버를 등록해 사용합니다. 클라이언트는 stdio로 이 서버를 실행하고 JSON-RPC로 통신합니다.

## 파라미터 (Parameters)

- 도구(요약; 자세한 스펙은 `@docs` 참고)
  - `news.fetch` → `GET /news` 프록시. 파라미터: `limit`, `cursor`, `sinceId`, `minImportance`, `q`, `symbol`, `startDate`, `endDate`
- 리소스(요약; 자세한 스펙은 `@docs` 참고)
  - `byul://news{?limit,cursor,sinceId,minImportance,q,symbol,startDate,endDate}`

각 응답에는 다음이 포함됩니다.
- 요약 문자열(예: “총 N건의 기사 반환”)
- Byul 원본 JSON 문자열

## 사용 가능한 도구 (Available Tools)

### `news.fetch`
- 설명: 최신 뉴스 데이터 가져오기
- 파라미터:
  - `limit` (number, optional) – 최대 기사 수(1-100)
  - `cursor` (string, optional) – 이전 페이지의 커서
  - `sinceId` (string, optional) – 해당 ID 이후 생성된 기사만
  - `minImportance` (number, optional) – 최소 중요도(1-10)
  - `q` (string, optional) – 검색 쿼리
  - `symbol` (string, optional) – 종목 코드 (예: AAPL)
  - `startDate` (string, optional) – 시작 시각 (ISO 8601, UTC)
  - `endDate` (string, optional) – 종료 시각 (ISO 8601, UTC)
- 예시 요청:

```txt
지난 1주일간 AAPL 관련 상위 5개 뉴스를 가져와줘
```


## 보안 (Security)

- API 키는 반드시 `BYUL_API_KEY` 환경변수로만 주입하세요. 코드/설정에 하드코딩하지 마십시오.

## 플랫폼별 설정 스니펫

### 1) Cursor (최신 버전)

`~/.cursor/mcp.json` 또는 프로젝트 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 2) Claude Code (VS Code 확장)

#### CLI

```bash
claude mcp add -e BYUL_API_KEY=byul_xxxxxxxxxxxxx --scope user byul npx -- -y @byul/mcp
```

#### 설정 JSON

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 3) Claude Desktop

#### `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 4) VS Code

#### 워크스페이스 `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 5) Windsurf

#### `windsurf_mcp.json`:

```json
{
  "mcpServers": {
    "mcp-server-byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": {
        "BYUL_API_KEY": "byul_xxxxxxxxxxxxx"
      }
    }
  }
}
```

## 문제 해결 (Troubleshooting)

- API 키 미설정
  - 오류 예시: `Missing BYUL_API_KEY environment variable`
  - 해결: 서버 실행 전에 `BYUL_API_KEY` 설정

- 프록시/방화벽 환경
  - 최초 실행 시 `npx`가 레지스트리에 접근해야 합니다. 사내 프록시 설정을 점검하세요.

- Windows/WSL 경로 및 환경변수
  - PowerShell 예시:
    ```powershell
    $env:BYUL_API_KEY = "byul_xxxxxxxxxxxxx"
    npx -y @byul/mcp
    ```

- 전송 범위
  - 본 패키지는 stdio 전송만 다룹니다. HTTP/SSE 전송은 본 문서에서 다루지 않습니다.

최신 MCP 사양을 준수합니다.
