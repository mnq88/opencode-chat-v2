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

### Recommended: clone into the OpenCode plugins directory

OpenCode discovers plugin packages under `~/.config/opencode/plugins/`
automatically. Clone at a pinned commit and install the runtime dependency:

```sh
git clone https://github.com/mnq88/opencode-chat-v2 ~/.config/opencode/plugins/opencode-chat-v2
cd ~/.config/opencode/plugins/opencode-chat-v2
git checkout <full-commit-sha>   # pin to a release commit
npm install --ignore-scripts --include=peer --include=optional
node bin/setup.mjs               # installs the agents into ~/.config/opencode/agents/
```

Then run `opencode service restart`.

### Alternative: point the config at a checkout

Any local checkout works as a config entry:

```jsonc
{
  "plugins": ["/absolute/path/to/opencode-chat-v2"]
}
```

The package root exposes `server.js`, which OpenCode resolves when it probes a
directory target. A direct path to `dist/server.js` is rejected by the loader
("configured plugin path must be a directory").

### Known limitation: `opencode plugin add` with Git targets

`opencode plugin add github:mnq88/opencode-chat-v2#<sha>` currently fails with
`git dep preparation failed`. OpenCode's bundled npm aborts during git
dependency preparation; the same spec installs cleanly with the system npm.
Until that is fixed upstream, use one of the two options above. For the same
reason, `dist/` is committed to this repository so no build step is needed at
install time.

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
node bin/setup.mjs --uninstall
# then remove the plugin directory (or config entry) and run opencode service restart
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
npm install
npm run build      # tsc
```

`dist/` is committed because OpenCode's bundled git installer does not run
build scripts. CI fails if `dist/` is out of sync with `src/`.

## License

MIT. The chat prompt and tool behavior derive from IgorWarzocha/Opencode-Chat
(MIT, © Igor Wiedler); semantic search integrates with opencode-rag-plugin
(MIT, © Christoph Döllinger). See LICENSE.
