/**
 * Persistent memory helpers.
 *
 * Memories are appended to the project's AGENTS.md, matching the behavior of
 * the original Chatifier plugin: because instruction files are re-read on
 * every turn, a remembered fact takes effect immediately and survives
 * sessions. Ported from IgorWarzocha/Opencode-Chat (MIT).
 */
import * as fs from "node:fs/promises"
import * as path from "node:path"

const MEMORIES_HEADING = "## Memories"
const MEMORIES_FILE = "AGENTS.md"
const INITIAL_CONTENT = "# User Preferences & Memories\n\n## Memories\n\n"

/**
 * Resolve the memories file inside the workspace root and refuse paths that
 * escape it. The root is the OpenCode location directory plus a constant file
 * name, but validating the final path keeps the file-access boundary explicit
 * and independent of the caller.
 */
export function memoriesPath(root: string): string {
  const base = path.resolve(root)
  const file = path.resolve(base, MEMORIES_FILE)
  const relative = path.relative(base, file)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Memory path escapes the workspace root")
  }
  return file
}

export async function remember(root: string, memory: string): Promise<string> {
  const trimmed = memory.trim()
  if (!trimmed) {
    throw new Error("Memory cannot be empty")
  }

  const file = memoriesPath(root)

  let content = ""
  try {
    content = await fs.readFile(file, "utf-8")
  } catch {
    content = INITIAL_CONTENT
  }

  if (!content.endsWith("\n")) {
    content += "\n"
  }
  if (!content.includes(MEMORIES_HEADING)) {
    content += `\n${MEMORIES_HEADING}\n\n`
  }

  const date = new Date().toISOString().slice(0, 10)
  content += `- ${trimmed} (${date})\n`

  await fs.writeFile(file, content, "utf-8")
  return `Remembered: "${trimmed}"`
}

export async function recall(root: string): Promise<string> {
  const file = memoriesPath(root)

  let content: string
  try {
    content = await fs.readFile(file, "utf-8")
  } catch {
    return "No memories stored yet."
  }

  const start = content.indexOf(MEMORIES_HEADING)
  if (start === -1) {
    return "No memories stored yet."
  }

  const section = content.slice(start + MEMORIES_HEADING.length)
  const nextHeading = section.search(/\n## /)
  const body = nextHeading === -1 ? section : section.slice(0, nextHeading)

  const memories = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))

  if (memories.length === 0) {
    return "No memories stored yet."
  }
  return memories.map((memory, index) => `${index + 1}. ${memory}`).join("\n")
}
