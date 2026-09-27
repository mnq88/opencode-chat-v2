# opencode-chat-v2

Chatifiers for OpenCode V2: conversational chat agents, persistent memory,
task tracking, and semantic code search — packaged as a plugin plus an agent
installer.

Successor to [IgorWarzocha/Opencode-Chat](https://github.com/IgorWarzocha/Opencode-Chat)
("Chatifier", npm `@howaboua/opencode-chat@0.1.10`). The original plugin
implements the OpenCode V1 plugin API and does not load on OpenCode V2:
V2 requires a `server` entrypoint and a `Plugin.define` default export, and
rejects V1 plugin objects. This project re-implements the user-visible
experience natively for V2.

## What it gives you

| Feature | Implementation |
| --- | --- |
| **Just Chat** agent | `agents/just-chat.md` — web, memory, todos, semantic search; no filesystem or shell |
| **Tool Chat** agent | `agents/tool-chat.md` — full toolkit plus chat tools |
| **Memory** | `chat_remember` / `chat_recall` tools, persisted in the project's `AGENTS.md` |
| **Task tracking** | `chat_todowrite` / `chat_todoread` tools backed by `todo.md` |
| **Semantic search** | `chat_semantic_search` tool delegating to the local [opencode-rag](https://github.com/MrDoe/OpenCodeRAG) CLI |

## Install

```sh
# 1. Install the agents into ~/.config/opencode/agents/
npx opencode-chat-v2

# 2. Add the plugin to opencode.jsonc
#    (the installer prints the exact snippet, including a SHA-pinned git form)
```

For a pinned Git install:

```jsonc
{
  "plugins": ["github:<owner>/opencode-chat-v2#<full-commit-sha>"]
}
```

Then run `opencode service restart`.

### Semantic search (optional)

```sh
npm install -g opencode-rag-plugin@2.2.1
ollama pull qwen3-embedding:0.6b
cd your-project && opencode-rag setup && opencode-rag index
```

`chat_semantic_search` returns setup instructions when the CLI or index is
missing; the rest of the experience works without it.

## Uninstall

```sh
npx opencode-chat-v2 --uninstall
# then remove the plugin entry from opencode.jsonc
```

## How it maps to the original Chatifier

| Original (V1) | Here (V2) | Notes |
| --- | --- | --- |
| `config` hook mutating agents and tool flags | `agents/*.md` + installer | V2 plugins cannot create agents (`AgentEditor` has no `add`), so agents ship as files |
| `tool` map with `chat_*` tools | `ctx.tool.transform` registrations | Same tool names and behavior |
| `experimental.chat.system.transform` + marker hack | Agent system prompt | A custom agent's prompt replaces the base in V2, making the marker unnecessary |
| fastembed + SQLite index at startup | opencode-rag CLI | Avoids loading an embedding model in the server process |
| `codex`-era native tool names | V2 permission actions | Disabled-tool matrix expressed as ordered permission rules |

## Development

```sh
npm install        # builds via prepare
npm run build      # tsc only
```

## License

MIT. The chat prompt and tool behavior derive from IgorWarzocha/Opencode-Chat
(MIT, © Igor Wiedler); semantic search integrates with opencode-rag-plugin
(MIT, © Christoph Döllinger). See LICENSE.
