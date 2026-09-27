export type TodoItem = {
    content: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "high" | "medium" | "low";
    id: string;
};
export declare function formatTodoMarkdown(todos: TodoItem[]): string;
export declare function readTodoFile(todoPath: string): Promise<TodoItem[]>;
export declare function writeTodoFile(todoPath: string, todos: TodoItem[]): Promise<string>;
