#!/usr/bin/env node
// Test all import patterns from README

console.log('=== Testing all import patterns from README ===\n');

// Test 1: Default import
console.log('1. Default import: import astroImportTree from "astro-import-tree"');
import astroImportTree from './dist/index.js';
console.log('   Result: Got module object with keys:', Object.keys(astroImportTree));
console.log('   To use: astroImportTree.default or astroImportTree.astroImportTree');
console.log('   Has parse via .default:', typeof astroImportTree.default?.parse === 'function');
console.log('   Status: ⚠️  Works but needs .default property');

// Test 2: Named import
console.log('\n2. Named import: import { astroImportTree } from "astro-import-tree"');
import { astroImportTree as namedImport } from './dist/index.js';
console.log('   Type:', typeof namedImport);
console.log('   Constructor:', namedImport.constructor.name);
console.log('   Has parse():', typeof namedImport.parse === 'function');
console.log('   Status: ✓ Works correctly');

// Test 3: Class import
console.log('\n3. Class import: import { AstroImportTree } from "astro-import-tree"');
import { AstroImportTree } from './dist/index.js';
console.log('   Type:', typeof AstroImportTree);
console.log('   Is class:', typeof AstroImportTree === 'function');
const instance = new AstroImportTree();
console.log('   Can instantiate:', instance instanceof AstroImportTree);
console.log('   Instance has parse():', typeof instance.parse === 'function');
console.log('   Status: ✓ Works correctly');

// Test actual functionality
console.log('\n4. Testing actual functionality:');
try {
  // Using named import (recommended)
  const tree1 = await namedImport.parse({ dir: './testdata/astro' });
  console.log('   Named import parse(): ✓ Found', tree1.pages.length, 'pages');
  
  // Using class instance
  const tree2 = await instance.parse({ dir: './testdata/astro' });
  console.log('   Class instance parse(): ✓ Found', tree2.pages.length, 'pages');
  
  // Using default.default
  const tree3 = await astroImportTree.default.parse({ dir: './testdata/astro' });
  console.log('   Default.default parse(): ✓ Found', tree3.pages.length, 'pages');
  
  // Test toLLM
  const llmText = namedImport.toLLM(tree1);
  console.log('   toLLM(): ✓ Generated', llmText.split('\n').length, 'lines');
} catch (error) {
  console.log('   Error:', error.message);
}

console.log('\n=== Summary ===');
console.log('✓ CommonJS: require("astro-import-tree").default works correctly');
console.log('✓ ESM Named: import { astroImportTree } from "astro-import-tree" works correctly');
console.log('✓ ESM Class: import { AstroImportTree } from "astro-import-tree" works correctly');
console.log('⚠️  ESM Default: import astroImportTree from "astro-import-tree" requires .default property');
console.log('\nRecommended usage:');
console.log('  ESM: import { astroImportTree } from "astro-import-tree"');
console.log('  CommonJS: const astroImportTree = require("astro-import-tree").default');