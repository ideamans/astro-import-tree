# astro-import-tree

A library to parse Astro page URL paths and import trees using AST analysis.

## Features

- Analyzes Astro project structure to map URL paths to their import dependencies
- Recursively traces all imports (`.astro`, `.js`, `.jsx`, `.ts`, `.tsx` files)
- Supports both static and dynamic imports
- Generates structured data or LLM-friendly text output
- Handles Astro-specific patterns like frontmatter and component imports

## Installation

```bash
npm install astro-import-tree

# Or install globally for CLI usage
npm install -g astro-import-tree
```

## CLI Usage

```bash
# Display LLM-friendly import tree
astro-import-tree llm ./my-astro-project

# Display JSON import tree
astro-import-tree json ./my-astro-project

# Specify custom pages directory
astro-import-tree llm ./my-astro-project --pages-dir src/content

# Suppress warning messages
astro-import-tree llm ./my-astro-project --quiet

# Show help
astro-import-tree --help
```

### Development with Yarn

When developing, you can use yarn commands to debug the CLI:

```bash
# Run CLI with arguments
yarn cli llm ./testdata/astro

# Quick run for LLM output
yarn cli:llm ./testdata/astro
```

## Programmatic Usage

### TypeScript/ES Modules

```typescript
// Recommended: Named import
import { astroImportTree } from 'astro-import-tree';

// Parse an Astro project
const tree = await astroImportTree.parse({
  dir: './', // Root directory of your Astro project
  pagesDir: 'src/pages' // Optional, defaults to 'src/pages'
});

console.log(tree);
// Output:
// {
//   "pages": [
//     {
//       "path": "/",
//       "imports": [
//         "@src/pages/index.astro",
//         "@src/components/Header.astro",
//         "@src/components/Hero.astro",
//         "@src/components/Hero/Image.astro",
//         "@src/components/Footer.astro"
//       ]
//     },
//     {
//       "path": "/about",
//       "imports": [
//         "@src/pages/about.astro",
//         "@src/components/Header.astro",
//         "@src/components/Footer.astro"
//       ]
//     }
//   ]
// }

// Generate LLM-friendly text
const llmText = astroImportTree.toLLM(tree);
console.log(llmText);
// Output:
// ## /, /index.html
// 
// - @src/pages/index.astro
// - @src/components/Header.astro
// - @src/components/Hero.astro
// - @src/components/Hero/Image.astro
// - @src/components/Footer.astro
// 
// ## /about, /about/index.html
// 
// - @src/pages/about.astro
// - @src/components/Header.astro
// - @src/components/Footer.astro
```

### CommonJS

```javascript
const astroImportTree = require('astro-import-tree').default;

// Parse an Astro project
const tree = await astroImportTree.parse({
  dir: './',
  pagesDir: 'src/pages'
});
```

### Alternative Import Methods

```typescript
// Import the class directly if you need multiple instances
import { AstroImportTree } from 'astro-import-tree';
const myInstance = new AstroImportTree();

// Default import (requires .default access in some environments)
import astroImportTreeModule from 'astro-import-tree';
const astroImportTree = astroImportTreeModule.default || astroImportTreeModule;
```

## API

### `astroImportTree.parse(options)`

Parses an Astro project and returns the import tree.

#### Options

- `dir` (string, required): The root directory of your Astro project
- `pagesDir` (string, optional): The pages directory relative to root. Defaults to `'src/pages'`

#### Returns

Returns a Promise that resolves to an `ImportTree` object:

```typescript
interface ImportTree {
  pages: ImportTreePage[];
}

interface ImportTreePage {
  path: string;      // URL path (e.g., "/", "/about")
  imports: string[]; // Array of import paths (e.g., "@src/components/Header.astro")
}
```

### `astroImportTree.toLLM(tree)`

Converts an import tree to an LLM-friendly text format.

#### Parameters

- `tree` (ImportTree): The import tree object from `parse()`

#### Returns

Returns a string with formatted import information for each page.

## How It Works

1. **Page Discovery**: Finds all `.astro` files in the pages directory
2. **URL Mapping**: Converts file paths to URL paths (e.g., `src/pages/about.astro` → `/about`)
3. **Import Analysis**: 
   - Parses Astro frontmatter for imports
   - Analyzes JavaScript/TypeScript imports
   - Follows relative and aliased imports
   - Handles dynamic imports and `Astro.glob()`
4. **Recursive Traversal**: Follows all imports to build the complete dependency tree
5. **Output Generation**: Formats the data as structured JSON or readable text

## Import Path Formats

The library formats all import paths with an `@` prefix followed by the relative path from the project root:

- `@src/pages/index.astro`
- `@src/components/Header.astro`
- `@src/layouts/BaseLayout.astro`

## License

MIT