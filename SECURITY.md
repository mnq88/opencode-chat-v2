# Security

## Verified findings

The repository is scanned with Aikido SAST on every change (see
`aikido_scan_paths` in the maintainer workflow). Findings are tracked here
with their verification status.

### `AIK_ts_generic_path_traversal` in `src/memory.ts` — false positive (verified)

The rule flags dynamic paths reaching `fs.readFile`. Verification:

1. **The path is not attacker-controlled.** `root` is `ctx.location.directory`,
   supplied by OpenCode for the workspace the plugin was loaded into. Model
   input (`memory`, a text string) is never used to build a path.
2. **The file name is a constant.** `MEMORIES_FILE = "AGENTS.md"`.
3. **The resolved path is boundary-checked.** `memoriesPath` resolves against
   the workspace root and rejects any result that escapes it
   (`relative.startsWith("..") || path.isAbsolute(relative)`).

The only file the module can touch is `<workspace>/AGENTS.md`. An escape is
rejected before any read or write. The same reasoning applies to `todo.md` in
`src/todo.ts`, whose path is composed in `src/server.ts` from the same trusted
root and a constant file name.

Residual risk: none identified. The finding reflects the heuristic's inability
to follow the constant filename and boundary check, not an exploitable
data flow.

## Reporting

Open an issue at <https://github.com/mnq88/opencode-chat-v2/issues> for
security-relevant reports rather than a public pull request.
