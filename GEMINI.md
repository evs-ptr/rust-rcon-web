# About Project

This is project about web site which handles websocket connection to the RCon (remote console) of any Rust Server which user has access to.

Bun is used as a package manager and runtime.

Packages:

- SvelteKit (v2.22.2)
- svelte (v5.35.4)
- tailwindcss (v4.1.11)
- vitest (v3.2.4)
- typescript (v5.8.3)

Basic rules for UI:

- We are using shadecn-svelte, so prefer its usage
- We are using `@lucide/svelte` for icons, so use only it for creating icons. Example: `import MoonIcon from '@lucide/svelte/icons/moon'`
- Avoid writing aria properties

Basic rules for writing CODE:

- ALWAYS use typescript, in .svelte files and other. No javascript at all.
- Avoid using clousers (anon functions) prefer creating functions:
  - BAD: `const foo = () => {}`
  - GOOD: `function foo() {}`
  - GOOD: `foo(() => {...})`
- Avoid using if-statements without brackets:
  - BAD: `if (flag) return`
  - GOOD:
    ```js
    if (flag) {
    	return
    }
    ```
- Avoid using old svelte:
  - Use runes:
    - GOOD: `let input: string = $state('')`
  - Don't use deprecated:
    - BAD: `<form on:submit={onSubmit}></form>`
    - GOOD: `<form onsubmit={onSubmit}></form>`
- CSS
  - Prefer using Tailwindcss (v4) instead of writing css classes/inlined css, unless usage of tailwind in current context will lead to abnormous class="..." size, then using css can be considered as allowed.
