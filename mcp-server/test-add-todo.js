import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function runTest() {
    console.log("Starting MCP Add-Todo Test...");
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

        const testCategory = "personal";
        const testTask = `Test task from script at ${new Date().toISOString()}`;

        console.log(`Adding todo to ${testCategory}: "${testTask}"...`);
        const result = await client.callTool({
            name: "add_todo",
            arguments: {
                category: testCategory,
                text: testTask
            }
        });

        console.log("Server response:", JSON.stringify(result, null, 2));

        if (result.content[0].text.includes("Added task")) {
            console.log("SUCCESS: Task added successfully.");
        } else {
            console.error("FAIL: Unexpected response from server.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Test failed with error:", error);
        process.exit(1);
    } finally {
        console.log("Closing connection...");
        process.exit(0);
    }
}

runTest();
