/**
 * Todo list helpers.
 *
 * Task lists live in a workspace-level todo.md with an embedded JSON payload,
 * and the file is removed once every task is completed. Ported from
 * IgorWarzocha/Opencode-Chat (MIT).
 */
import * as fs from "node:fs/promises"

export type TodoItem = {
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "high" | "medium" | "low"
  id: string
}

export function formatTodoMarkdown(todos: TodoItem[]): string {
  const lines = ["# Todo", ""]
  for (const todo of todos) {
    const box = todo.status === "completed" ? "x" : " "
    lines.push(
      `- [${box}] ${todo.content} (priority: ${todo.priority}, id: ${todo.id}, status: ${todo.status})`,
    )
  }
  lines.push("", "<!-- opencode-todo")
  lines.push(JSON.stringify(todos, null, 2))
  lines.push("-->")
  return lines.join("\n")
}

export async function readTodoFile(todoPath: string): Promise<TodoItem[]> {
  const exists = await fs
    .stat(todoPath)
    .then(() => true)
    .catch(() => false)
  if (!exists) return []

  const content = await fs.readFile(todoPath, "utf-8")
  const match = content.match(/<!-- opencode-todo\n([\s\S]*?)\n-->/)
  if (!match || match[1] === undefined) return []

  try {
    const parsed: unknown = JSON.parse(match[1])
    if (Array.isArray(parsed)) return parsed as TodoItem[]
  } catch {
    return []
  }
  return []
}

export async function writeTodoFile(todoPath: string, todos: TodoItem[]): Promise<string> {
  const remaining = todos.filter((todo) => todo.status !== "completed")
  if (remaining.length === 0) {
    await fs.unlink(todoPath).catch(() => {})
    return "All todos completed. Removed todo.md."
  }

  const content = formatTodoMarkdown(todos)
  await fs.writeFile(todoPath, content, "utf-8")
  return `${remaining.length} todos remaining. Updated todo.md.`
}
