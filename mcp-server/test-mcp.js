import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function runTest() {
    console.log("Starting MCP Client Test...");
    const transport = new SSEClientTransport(new URL("http://localhost:3000/sse"));
    const client = new Client({
        name: "test-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    try {
        console.log("Connecting to server...");
        await client.connect(transport);
        console.log("Connected successfully!");

        console.log("Listing tools...");
        const tools = await client.listTools();
        console.log("Available tools:", JSON.stringify(tools, null, 2));

        if (tools.tools.some(t => t.name === 'add_todo')) {
            console.log("SUCCESS: add_todo tool found.");
        } else {
            console.error("FAIL: add_todo tool NOT found.");
            process.exit(1);
        }

        console.log("Listing todos (Before)...");
        let result = await client.callTool({
            name: "list_todos",
            arguments: {}
        });
        console.log("Current content length:", result.content[0].text.length);

        console.log("Testing add_todo...");
        const addResult = await client.callTool({
            name: "add_todo",
            arguments: {
                category: "personal",
                text: "Test task from test-mcp.js"
            }
        });
        console.log("Add Result:", addResult.content[0].text);

        console.log("Listing todos (After)...");
        result = await client.callTool({
            name: "list_todos",
            arguments: {}
        });
        console.log("New content length:", result.content[0].text.length);

    } catch (error) {
        console.error("Test failed with error:", error);
        process.exit(1);
    } finally {
        console.log("Closing connection...");
        process.exit(0);
    }
}

runTest();
