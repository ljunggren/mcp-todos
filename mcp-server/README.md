# Productivity MCP Server

This is a Model Context Protocol (MCP) server that exposes your productivity workspace (tasks and notes) to LLMs. It supports Server-Sent Events (SSE) for remote access.

## Features

### Tools
- `list_todos`: Returns all tasks across all categories in the `todos/` directory.
- `add_todo`: Adds a new task to a specific category (e.g., "personal", "boozang"). Creates the category file if it doesn't exist.

## How it Works

When you call `add_todo`, the server:
1. Finds (or creates) the `.md` file in the `todos/` directory.
2. Appends the task as a Markdown checkbox: `- [ ] your task`.
3. Writes the file back to disk.

This ensures your tasks are always stored as plain text files that you can edit manually or sync via iCloud/Git.

### Resources
- `todos://{category}`: Direct markdown access to a specific to-do file.

## Usage

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
   The server will run on port 3000.

### Deployment with Docker
1. Build the image:
   ```bash
   docker build -t productivity-mcp .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 -v $(pwd)/../todos:/app/todos productivity-mcp
   ```

## Transport
The server uses **SSE (Server-Sent Events)**.
- **SSE Endpoint:** `http://<host>:<port>/sse`
- **Post Messages:** `http://<host>:<port>/messages`

### Example: List Tools (cURL)
1. In one terminal, start the stream:
   ```bash
   curl -N http://localhost:3000/sse
   ```
2. In another terminal, send the request:
   ```bash
   curl -X POST http://localhost:3000/messages \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```

### Example: Add Todo (Console / Fetch)
Run this in your browser console. **Note:** You must have an active `curl` or browser tab listening to `/sse` first!

```javascript
// 1. Send the request
await fetch('http://localhost:3000/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "add_todo",
      arguments: { category: "personal", text: "Fix the 400 error" }
    }
  })
});
```

## Verification Scripts

We provide standalone scripts to verify that the server is working correctly without needing a manual `curl` listener.

### 1. Full Connectivity Test
Verifies connection, lists tools, and tests `add_todo`.
```bash
node test-mcp.js
```

### 2. Targeted Add-Todo Test
Tests only the `add_todo` tool with a timestamped message.
```bash
node test-add-todo.js
```

> [!NOTE]
> These scripts use the official `@modelcontextprotocol/sdk` and handle the SSE `sessionId` automatically. Make sure the server is running (`./start.sh`) before running them.

> [!NOTE]
> The MCP SSE transport requires a `sessionId`. This server is configured to automatically route messages to the active session if only one person is connected. If multiple people connect, you must append `?sessionId=...` to the URL.
