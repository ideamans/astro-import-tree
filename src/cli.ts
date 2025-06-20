#!/usr/bin/env node

import * as path from 'path';
import astroImportTree from './index.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Show help if no arguments or help flag
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
astro-import-tree - Parse Astro page URL paths and import trees

Usage:
  astro-import-tree llm <project-path>    Display LLM-friendly import tree
  astro-import-tree json <project-path>   Display JSON import tree
  astro-import-tree --help               Show this help message

Examples:
  astro-import-tree llm ./my-astro-project
  astro-import-tree json ./my-astro-project --pages-dir src/content
  astro-import-tree llm ./my-astro-project --quiet

Options:
  --pages-dir <path>  Pages directory relative to project root (default: src/pages)
  --quiet, -q         Suppress warning messages
`);
    process.exit(0);
  }

  const command = args[0];
  const projectPath = args[1];

  if (!projectPath) {
    console.error('Error: Project path is required');
    process.exit(1);
  }

  // Parse options
  let pagesDir = 'src/pages';
  const pagesDirIndex = args.indexOf('--pages-dir');
  if (pagesDirIndex !== -1 && args[pagesDirIndex + 1]) {
    pagesDir = args[pagesDirIndex + 1];
  }

  // Check for quiet mode
  const quiet = args.includes('--quiet') || args.includes('-q');
  if (quiet) {
    astroImportTree.setSuppressWarnings(true);
  }

  try {
    const absolutePath = path.resolve(projectPath);
    if (!quiet) {
      console.error(`Analyzing Astro project at: ${absolutePath}`);
    }
    
    const tree = await astroImportTree.parse({
      dir: absolutePath,
      pagesDir
    });

    switch (command) {
      case 'llm':
        console.log(astroImportTree.toLLM(tree));
        break;
      
      case 'json':
        console.log(JSON.stringify(tree, null, 2));
        break;
      
      default:
        console.error(`Error: Unknown command "${command}"`);
        console.error('Use --help to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error analyzing project:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});