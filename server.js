/**
 * Package entrypoint shim.
 *
 * OpenCode V2 resolves a directory or package target by probing `server` and
 * `index` subpaths, so this re-export makes the package root loadable while
 * the implementation stays in dist/.
 */
export { default } from "./dist/server.js"
