/**
 * Resolve the memories file inside the workspace root and refuse paths that
 * escape it. The root is the OpenCode location directory plus a constant file
 * name, but validating the final path keeps the file-access boundary explicit
 * and independent of the caller.
 */
export declare function memoriesPath(root: string): string;
export declare function remember(root: string, memory: string): Promise<string>;
export declare function recall(root: string): Promise<string>;
