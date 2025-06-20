import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs/promises';
import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';

// @babel/traverse のデフォルトエクスポート対応
const traverseFn = (traverse as any).default || traverse;
import * as t from '@babel/types';

export interface ImportTreePage {
  path: string;
  imports: string[];
}

export interface ImportTree {
  pages: ImportTreePage[];
}

export interface ParseOptions {
  dir: string;
  pagesDir?: string;
}

class AstroImportTree {
  private visitedFiles = new Set<string>();
  private importMap = new Map<string, Set<string>>();
  private suppressWarnings = false;

  setSuppressWarnings(suppress: boolean): void {
    this.suppressWarnings = suppress;
  }

  async parse(options: ParseOptions): Promise<ImportTree> {
    const { dir, pagesDir = 'src/pages' } = options;
    const absoluteDir = path.resolve(dir);
    const absolutePagesDir = path.join(absoluteDir, pagesDir);

    // Find all .astro files in pages directory
    const pageFiles = await glob('**/*.astro', {
      cwd: absolutePagesDir,
      absolute: true,
    });

    const pages: ImportTreePage[] = [];

    for (const pageFile of pageFiles) {
      this.visitedFiles.clear();
      this.importMap.clear();

      // Get URL path from file path
      const relativePath = path.relative(absolutePagesDir, pageFile);
      const urlPath = this.getUrlPath(relativePath);

      // Analyze imports
      await this.analyzeImports(pageFile, absoluteDir);

      // Convert to sorted array
      const imports = Array.from(this.visitedFiles)
        .map(file => this.formatImportPath(file, absoluteDir))
        .sort();

      pages.push({
        path: urlPath,
        imports,
      });
    }

    return { pages };
  }

  private getUrlPath(relativePath: string): string {
    // Remove .astro extension
    let urlPath = relativePath.replace(/\.astro$/, '');

    // Convert to URL path
    urlPath = '/' + urlPath.replace(/\\/g, '/');

    // Handle index files
    if (urlPath.endsWith('/index')) {
      urlPath = urlPath.slice(0, -6) || '/';
    }

    return urlPath;
  }

  private formatImportPath(absolutePath: string, baseDir: string): string {
    const relativePath = path.relative(baseDir, absolutePath);
    return '@' + relativePath.replace(/\\/g, '/');
  }

  private async analyzeImports(filePath: string, baseDir: string): Promise<void> {
    if (this.visitedFiles.has(filePath)) {
      return;
    }

    this.visitedFiles.add(filePath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath);

      if (ext === '.astro') {
        await this.analyzeAstroFile(content, filePath, baseDir);
      } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        await this.analyzeJsFile(content, filePath, baseDir);
      }
    } catch (error) {
      // Skip files that cannot be read
      if (!this.suppressWarnings) {
        console.warn(`Warning: Could not read file ${filePath}:`, error);
      }
    }
  }

  private async analyzeAstroFile(content: string, filePath: string, baseDir: string): Promise<void> {
    // Extract frontmatter script section
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      await this.analyzeJsCode(frontmatter, filePath, baseDir);
    }

    // Extract script tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      await this.analyzeJsCode(match[1], filePath, baseDir);
    }

    // Extract Astro component imports
    const componentRegex = /<(\w+)\s+[^>]*>/g;
    const components = new Set<string>();
    while ((match = componentRegex.exec(content)) !== null) {
      const tagName = match[1];
      // Skip HTML tags
      if (!tagName.match(/^[A-Z]/) && !tagName.includes('.')) {
        continue;
      }
      components.add(tagName);
    }
  }

  private async analyzeJsFile(content: string, filePath: string, baseDir: string): Promise<void> {
    await this.analyzeJsCode(content, filePath, baseDir);
  }

  private async analyzeJsCode(code: string, filePath: string, baseDir: string): Promise<void> {
    try {
      const ast = babelParse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      const fileDir = path.dirname(filePath);
      const importPaths: string[] = [];

      traverseFn(ast, {
        ImportDeclaration(nodePath: any) {
          const importPath = nodePath.node.source.value;
          importPaths.push(importPath);
        },
        CallExpression(nodePath: any) {
          // Handle dynamic imports
          if (
            t.isIdentifier(nodePath.node.callee, { name: 'import' }) ||
            (t.isMemberExpression(nodePath.node.callee) &&
              t.isIdentifier(nodePath.node.callee.object, { name: 'Astro' }) &&
              t.isIdentifier(nodePath.node.callee.property, { name: 'glob' }))
          ) {
            const arg = nodePath.node.arguments[0];
            if (t.isStringLiteral(arg)) {
              importPaths.push(arg.value);
            }
          }
        },
      });

      // Resolve and analyze imported files
      for (const importPath of importPaths) {
        const resolvedPaths = await this.resolveImportPath(importPath, fileDir, baseDir);
        for (const resolvedPath of resolvedPaths) {
          await this.analyzeImports(resolvedPath, baseDir);
        }
      }
    } catch (error) {
      // Skip files that cannot be parsed
      if (!this.suppressWarnings) {
        console.warn(`Warning: Could not parse JavaScript in ${filePath}:`, error);
      }
    }
  }

  private async resolveImportPath(importPath: string, fromDir: string, baseDir: string): Promise<string[]> {
    // Handle glob patterns
    if (importPath.includes('*')) {
      const pattern = importPath.startsWith('.') 
        ? path.join(fromDir, importPath)
        : path.join(baseDir, 'src', importPath.replace(/^@\//, ''));
      
      try {
        const files = await glob(pattern);
        return files;
      } catch {
        return [];
      }
    }

    // Handle regular imports
    let resolvedPath: string;

    if (importPath.startsWith('.')) {
      // Relative import
      resolvedPath = path.resolve(fromDir, importPath);
    } else if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
      // Alias import
      resolvedPath = path.join(baseDir, 'src', importPath.slice(2));
    } else if (!importPath.includes('/') || importPath.startsWith('@')) {
      // Node module, skip
      return [];
    } else {
      // Assume src-relative
      resolvedPath = path.join(baseDir, 'src', importPath);
    }

    // Try different extensions
    const extensions = ['', '.astro', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      try {
        await fs.access(fullPath);
        return [fullPath];
      } catch {
        // Try next extension
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, 'index' + ext);
      try {
        await fs.access(indexPath);
        return [indexPath];
      } catch {
        // Try next extension
      }
    }

    return [];
  }

  toLLM(tree: ImportTree): string {
    const sections: string[] = [];

    for (const page of tree.pages) {
      const urls = [page.path];
      
      // Add index.html variant
      if (page.path === '/') {
        urls.push('/index.html');
      } else {
        urls.push(page.path + '/index.html');
      }

      const urlsStr = urls.join(', ');
      const importsStr = page.imports.map(imp => `- ${imp}`).join('\n');
      
      sections.push(`## ${urlsStr}\n\n${importsStr}`);
    }

    return sections.join('\n\n');
  }
}

const astroImportTree = new AstroImportTree();

// デフォルトエクスポート
export default astroImportTree;

// 名前付きエクスポート（互換性のため）
export { astroImportTree };

// クラスもエクスポート（必要に応じて）
export { AstroImportTree };