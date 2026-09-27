/**
 * Semantic search bridge.
 *
 * Delegates to the separately installed opencode-rag CLI
 * (https://github.com/MrDoe/OpenCodeRAG, MIT) instead of embedding a local
 * model at startup. Arguments are passed as an array without a shell, so
 * user-provided text cannot be interpreted as a command.
 */
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

const INSTALL_HINT =
  "Semantic search is not set up in this workspace.\n" +
  "Install and index it once with:\n" +
  "  npm install -g opencode-rag-plugin@2.2.1\n" +
  "  ollama pull qwen3-embedding:0.6b\n" +
  "  opencode-rag setup && opencode-rag index"

async function runCli(root: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await run("opencode-rag", args, {
      cwd: root,
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    })
    return stdout.trim()
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ENOENT") {
      return INSTALL_HINT
    }
    const stderr = (error as { stderr?: string }).stderr
    const message = stderr?.trim() || (error as Error).message
    return `Semantic search failed: ${message}`
  }
}

export async function semanticQuery(root: string, query: string): Promise<string> {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new Error("Query cannot be empty")
  }
  const output = await runCli(root, ["query", trimmed])
  return output || "No results."
}

export async function semanticStatus(root: string): Promise<string> {
  return runCli(root, ["status"])
}
