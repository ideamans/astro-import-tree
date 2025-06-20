import { describe, it, expect } from 'vitest';
import * as path from 'path';
import astroImportTree from '../src/index.js';

describe('AstroImportTree', () => {
  it('should parse Astro import tree', async () => {
    const tree = await astroImportTree.parse({
      dir: path.join(process.cwd(), 'testdata/astro'),
    });

    // Check that we have the expected pages
    expect(tree.pages.length).toBe(2);

    // Find index page
    const indexPage = tree.pages.find(p => p.path === '/');
    expect(indexPage).toBeTruthy();
    expect(indexPage!.imports).toEqual([
      '@src/components/Footer.astro',
      '@src/components/Header.astro',
      '@src/components/Hero.astro',
      '@src/components/Hero/Image.astro',
      '@src/pages/index.astro',
    ]);

    // Find about page
    const aboutPage = tree.pages.find(p => p.path === '/about');
    expect(aboutPage).toBeTruthy();
    expect(aboutPage!.imports).toEqual([
      '@src/components/Footer.astro',
      '@src/components/Header.astro',
      '@src/pages/about.astro',
    ]);
  });

  it('should generate correct LLM text format', async () => {
    const tree = await astroImportTree.parse({
      dir: path.join(process.cwd(), 'testdata/astro'),
    });

    const llmText = astroImportTree.toLLM(tree);

    // Check that the text contains expected sections
    expect(llmText).toContain('## /, /index.html');
    expect(llmText).toContain('## /about, /about/index.html');
    
    // Check that imports are listed
    expect(llmText).toContain('- @src/components/Header.astro');
    expect(llmText).toContain('- @src/components/Footer.astro');
    expect(llmText).toContain('- @src/components/Hero.astro');
    expect(llmText).toContain('- @src/components/Hero/Image.astro');
  });
});