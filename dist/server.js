/**
 * opencode-chat-v2 server entrypoint.
 *
 * Registers the chat toolset for OpenCode V2:
 *   chat_remember, chat_recall, chat_todowrite, chat_todoread,
 *   chat_semantic_search
 *
 * The chat agents themselves ship as Markdown files under agents/ and are
 * installed by bin/setup.mjs. The V2 plugin API cannot create agents, so the
 * installer plus this plugin together form the full package.
 */
import * as path from "node:path";
import { Plugin } from "@opencode/plugin";
import { recall, remember } from "./memory.js";
import { readTodoFile, writeTodoFile } from "./todo.js";
import { semanticQuery } from "./rag.js";
export default Plugin.define({
    id: "opencode-chat-v2",
    async setup(ctx) {
        const root = ctx.location.directory;
        const todoPath = path.join(root, "todo.md");
        await ctx.tool.transform((editor) => {
            editor.namespace({
                name: "chat",
                description: "Chatifier tools for memory, task tracking, and semantic code search",
            });
            editor.add({
                name: "chat_remember",
                description: `Save something to long-term memory. Use this to remember:
- User preferences (e.g., "User prefers concise responses")
- Important facts (e.g., "User's project uses React 19")
- Style preferences (e.g., "User likes bullet points over paragraphs")

Memories persist across conversations. Keep each memory to ONE short sentence.`,
                input: {
                    type: "object",
                    properties: {
                        memory: {
                            type: "string",
                            description: "A single short sentence to remember. Be specific and concise.",
                        },
                    },
                    required: ["memory"],
                    additionalProperties: false,
                },
                async execute(input) {
                    const { memory } = input;
                    return { content: await remember(root, memory) };
                },
            });
            editor.add({
                name: "chat_recall",
                description: `Read stored long-term memories. Use when the user asks what you remember or before starting work that depends on their preferences.`,
                input: {
                    type: "object",
                    properties: {},
                    additionalProperties: false,
                },
                async execute() {
                    return { content: await recall(root) };
                },
            });
            editor.add({
                name: "chat_todowrite",
                description: `Manage the task list in todo.md.

Usage:
- Use for multi-step tasks (3+ steps)
- Only one task in_progress at a time
- Mark tasks complete immediately after finishing
- Skip for simple, single-step requests`,
                input: {
                    type: "object",
                    properties: {
                        todos: {
                            type: "array",
                            description: "The updated todo list",
                            items: {
                                type: "object",
                                properties: {
                                    content: { type: "string", description: "Brief description of the task" },
                                    status: {
                                        type: "string",
                                        enum: ["pending", "in_progress", "completed", "cancelled"],
                                        description: "Current status of the task",
                                    },
                                    priority: {
                                        type: "string",
                                        enum: ["high", "medium", "low"],
                                        description: "Priority level of the task",
                                    },
                                    id: { type: "string", description: "Unique identifier for the todo item" },
                                },
                                required: ["content", "status", "priority", "id"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["todos"],
                    additionalProperties: false,
                },
                async execute(input) {
                    const { todos } = input;
                    const message = await writeTodoFile(todoPath, todos);
                    return { content: `${message}\n${JSON.stringify(todos, null, 2)}` };
                },
            });
            editor.add({
                name: "chat_todoread",
                description: `Read the task list from todo.md.

Usage:
- Check at the start of conversations
- Use before starting new tasks
- Review after completing work`,
                input: {
                    type: "object",
                    properties: {},
                    additionalProperties: false,
                },
                async execute() {
                    const todos = await readTodoFile(todoPath);
                    return { content: JSON.stringify(todos, null, 2) };
                },
            });
            editor.add({
                name: "chat_semantic_search",
                description: `Search the codebase by meaning using the local semantic index. Use for questions like "where is auth handled?".

Requires the opencode-rag CLI to be installed and the workspace indexed. Returns file paths, line ranges, and relevant code chunks.`,
                input: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Natural-language search query",
                        },
                    },
                    required: ["query"],
                    additionalProperties: false,
                },
                async execute(input) {
                    const { query } = input;
                    return { content: await semanticQuery(root, query) };
                },
            });
        });
    },
});
