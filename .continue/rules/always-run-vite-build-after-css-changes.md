---
globs: "**/*.css"
---

After editing CSS files, always run `npx vite build` (not just `npx tsc --noEmit`) to verify there are no PostCSS parse errors like unclosed blocks. TypeScript compilation does NOT validate CSS.