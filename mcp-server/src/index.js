import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TODOS_DIR = path.resolve(__dirname, "../../todos");

const server = new Server(
    {
        name: "productivity-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

function sanitizeCategory(category) {
    if (!category || typeof category !== "string") {
        throw new Error("Category must be a string");
    }
    // Only allow alphanumeric, hyphens, and underscores to prevent path traversal
    if (!/^[a-z0-9-_]+$/i.test(category)) {
        throw new Error(`Invalid category name: ${category}`);
    }
    return category;
}


// --- Resources ---

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const files = await fs.readdir(TODOS_DIR);
    return {
        resources: files
            .filter((f) => f.endsWith(".md"))
            .map((f) => ({
                uri: `todos://${f.replace(".md", "")}`,
                name: f.replace(".md", " tasks"),
                mimeType: "text/markdown",
            })),
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const category = sanitizeCategory(url.host);
    const filePath = path.join(TODOS_DIR, `${category}.md`);

    try {
        const content = await fs.readFile(filePath, "utf-8");
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "text/markdown",
                    text: content,
                },
            ],
        };
    } catch (error) {
        throw new Error(`Category ${category} not found`);
    }
});

// --- Tools ---

const AddTodoSchema = z.object({
    category: z.string().describe("The category (e.g., personal, boozang)"),
    text: z.string().describe("The task description"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add_todo",
                description: "Add a new to-do item to a category",
                inputSchema: {
                    type: "object",
                    properties: {
                        category: { type: "string", description: "The category (e.g., personal, boozang)" },
                        text: { type: "string", description: "The task description" }
                    },
                    required: ["category", "text"]
                },
            },
            {
                name: "list_todos",
                description: "List all categories and their tasks",
                inputSchema: { type: "object", properties: {} },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "list_todos") {
        const files = await fs.readdir(TODOS_DIR);
        const results = await Promise.all(
            files
                .filter((f) => f.endsWith(".md"))
                .map(async (f) => {
                    const content = await fs.readFile(path.join(TODOS_DIR, f), "utf-8");
                    return `### ${f.replace(".md", "")}\n${content}`;
                })
        );
        return {
            content: [{ type: "text", text: results.join("\n\n") }],
        };
    }

    if (request.params.name === "add_todo") {
        const { category: rawCategory, text } = AddTodoSchema.parse(request.params.arguments);
        const category = sanitizeCategory(rawCategory);
        const filePath = path.join(TODOS_DIR, `${category}.md`);

        try {
            let content = await fs.readFile(filePath, "utf-8");

            // Ensure content ends with exactly one newline before appending
            content = content.trimEnd();

            // If it's an empty file or just title, prepare for list
            if (content.length === 0) {
                content = `# ${category.charAt(0).toUpperCase() + category.slice(1)} To-Do\n`;
            }

            content += `\n- [ ] ${text}\n`;
            await fs.writeFile(filePath, content);
            return {
                content: [{ type: "text", text: `Added task to ${category}` }],
            };
        } catch (error) {
            // Handle file not found by creating a new one
            if (error.code === 'ENOENT') {
                const newContent = `# ${category.charAt(0).toUpperCase() + category.slice(1)} To-Do\n\n- [ ] ${text}\n`;
                await fs.writeFile(filePath, newContent);
                return {
                    content: [{ type: "text", text: `Created new category ${category} and added task` }],
                };
            }
            throw error;
        }
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
});

// --- Transport (SSE) ---

const app = express();
app.use(cors());
// Removed express.json() because it interferes with SSEServerTransport's stream reading

const transports = new Map();

app.get("/health", (req, res) => {
    res.json({ status: "ok", active_sessions: transports.size });
});

app.get("/sse", async (req, res) => {
    console.log("[SSE] New connection request");

    // The first argument is the URL that the client should POST to.
    // The client will append ?sessionId=... to this.
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    console.log(`[SSE] Session started: ${sessionId}`);

    req.on("close", () => {
        console.log(`[SSE] Session closed: ${sessionId}`);
        transports.delete(sessionId);
    });

    try {
        await server.connect(transport);
    } catch (err) {
        console.error(`[SSE] Error in connect: ${err.message}`);
    }
});

app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    console.log(`[POST] Incoming message for session: ${sessionId}`);

    const transport = transports.get(sessionId);

    if (!transport) {
        console.error(`[POST] Session not found: ${sessionId}`);
        return res.status(400).send("Session not found. Connect to /sse first.");
    }

    try {
        await transport.handlePostMessage(req, res);
    } catch (err) {
        console.error(`[POST] Error in handlePostMessage: ${err.message}`);
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MCP server listening on port ${PORT}`);
});
