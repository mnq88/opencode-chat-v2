#!/usr/bin/env node
/**
 * opencode-chat-v2 installer.
 *
 * The OpenCode V2 plugin API cannot create agents, so this script installs the
 * chat agents (just-chat, tool-chat) into the user's OpenCode config directory
 * and prints the plugin wiring for opencode.json(c).
 */
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(here, "..")
const agentsSource = path.join(packageRoot, "agents")

const configDir = process.env.OPENCODE_CONFIG_DIR ?? path.join(os.homedir(), ".config", "opencode")
const agentsTarget = path.join(configDir, "agents")

const args = new Set(process.argv.slice(2))
const uninstall = args.has("--uninstall")
const withRag = args.has("--with-rag")
const help = args.has("--help") || args.has("-h")

function log(message) {
  process.stdout.write(`${message}\n`)
}

if (help) {
  log(`opencode-chat-v2 installer

Usage:
  opencode-chat-v2 [--uninstall] [--with-rag]

Options:
  --uninstall  Remove the installed chat agents
  --with-rag   Also print semantic-search setup commands
  --help       Show this help

Environment:
  OPENCODE_CONFIG_DIR  Override the OpenCode config directory (default: ~/.config/opencode)
`)
  process.exit(0)
}

async function exists(file) {
  return stat(file).then(
    () => true,
    () => false,
  )
}

async function installAgents() {
  if (!(await exists(agentsSource))) {
    log(`No agents directory found at ${agentsSource}; run the build/install from the package root.`)
    process.exit(1)
  }

  await mkdir(agentsTarget, { recursive: true })
  const entries = (await readdir(agentsSource)).filter((name) => name.endsWith(".md"))

  for (const entry of entries) {
    const source = path.join(agentsSource, entry)
    const target = path.join(agentsTarget, entry)
    if (await exists(target)) {
      log(`Skipping ${target} (already exists; remove it first to reinstall)`)
      continue
    }
    await cp(source, target)
    log(`Installed agent: ${target}`)
  }
}

async function uninstallAgents() {
  const entries = ["just-chat.md", "tool-chat.md"]
  for (const entry of entries) {
    const target = path.join(agentsTarget, entry)
    if (await exists(target)) {
      await rm(target)
      log(`Removed ${target}`)
    }
  }
}

async function main() {
  if (uninstall) {
    await uninstallAgents()
    return
  }

  await installAgents()

  log("")
  log("Next: add the plugin to your OpenCode config (opencode.jsonc):")
  log("")
  log(`  "plugins": ["${packageRoot.replaceAll("\\", "/")}"]`)
  log("")
  log("For a pinned install from git, use the full commit SHA of this repository:")
  log("")
  log(`  "plugins": ["github:mnq88/opencode-chat-v2#<full-sha>"]`)
  log("")
  log("Restart OpenCode afterwards: opencode service restart")

  if (withRag) {
    log("")
    log("Semantic search setup (requires Ollama):")
    log("")
    log("  npm install -g opencode-rag-plugin@2.2.1")
    log("  ollama pull qwen3-embedding:0.6b")
    log("  cd <your-project> && opencode-rag setup && opencode-rag index")
  }
}

main().catch((error) => {
  log(`Install failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
