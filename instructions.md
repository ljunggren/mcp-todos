# MCP Server Development Best Practices

To ensure safety and reliability when developing local MCP servers for this workspace, follow these guidelines:

## 1. Security & Path Safety
- **Always** sanitize input derived from tool arguments before using them in file system operations.
- **Whitelist** allowed characters for filenames (e.g., alphanumeric, hyphens, underscores) to prevent path traversal attacks.

## 2. File I/O Robustness
- **Prefer** `fs/promises` for asynchronous, non-blocking file operations.
- **Atomic Writes**: For production systems, use atomic write strategies (e.g., `write-file-atomic`) to prevent data corruption during crashes.
- **Error Handling**: Explicitly handle `ENOENT` (file not found) and other system errors to provide meaningful feedback to the AI client.

## 3. Markdown Structure
- **Predictable Formatting**: Always maintain a consistent Markdown structure (e.g., `# Header` followed by `- [ ] Task`).
- **Cleaning**: Use `trimEnd()` before appending to prevent excessive whitespace buildup.

## 4. Lifecycle Management
- **Status Checks**: Provide a `/health` endpoint or similar mechanism to verify server availability.
- **Logging**: Log significant events (session start/stop, write operations) to a persistent log file (e.g., `server.log`) for troubleshooting.

## 5. Documentation & Visualization
- **Sequence Diagrams**: Use Mermaid `sequenceDiagram` to visualize JSON-RPC call flows and complex server-client interactions.
- **Architecture Diagrams**: Use Mermaid `graph TD` for high-level infrastructure overviews.
- **Standardized Graphics**: Favor text-based diagrams (Mermaid) over external image files for ease of versioning and searchability.
- **UML/Domain Models**: For complex data structures, include UML class diagrams or domain models using Mermaid where applicable.
