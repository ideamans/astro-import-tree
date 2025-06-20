# astro-import-tree

ASTを使用してAstroページのURLパスとインポートツリーを解析するライブラリです。

## 機能

- AstroプロジェクトのURLパスとインポート依存関係のマッピングを分析
- すべてのインポート（`.astro`、`.js`、`.jsx`、`.ts`、`.tsx`ファイル）を再帰的に追跡
- 静的インポートと動的インポートの両方をサポート
- 構造化データまたはLLMフレンドリーなテキスト出力を生成
- frontmatterやコンポーネントインポートなどのAstro固有のパターンを処理

## インストール

```bash
npm install astro-import-tree

# またはCLI使用のためにグローバルインストール
npm install -g astro-import-tree
```

## CLI使用方法

```bash
# LLMフレンドリーなインポートツリーを表示
astro-import-tree llm ./my-astro-project

# JSONインポートツリーを表示
astro-import-tree json ./my-astro-project

# カスタムpagesディレクトリを指定
astro-import-tree llm ./my-astro-project --pages-dir src/content

# 警告メッセージを抑制
astro-import-tree llm ./my-astro-project --quiet

# ヘルプを表示
astro-import-tree --help
```

### Yarnでの開発

開発時は、yarnコマンドを使用してCLIをデバッグできます：

```bash
# 引数付きでCLIを実行
yarn cli llm ./testdata/astro

# LLM出力のクイック実行
yarn cli:llm ./testdata/astro
```

## プログラムでの使い方

### TypeScript/ES Modules

```typescript
// 推奨: 名前付きインポート
import { astroImportTree } from 'astro-import-tree';

// Astroプロジェクトを解析
const tree = await astroImportTree.parse({
  dir: './', // Astroプロジェクトのルートディレクトリ
  pagesDir: 'src/pages' // オプション、デフォルトは'src/pages'
});

console.log(tree);
// 出力:
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

// LLMフレンドリーなテキストを生成
const llmText = astroImportTree.toLLM(tree);
console.log(llmText);
// 出力:
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

// Astroプロジェクトを解析
const tree = await astroImportTree.parse({
  dir: './',
  pagesDir: 'src/pages'
});
```

### その他のインポート方法

```typescript
// 複数のインスタンスが必要な場合はクラスを直接インポート
import { AstroImportTree } from 'astro-import-tree';
const myInstance = new AstroImportTree();

// デフォルトインポート（一部の環境では.defaultアクセスが必要）
import astroImportTreeModule from 'astro-import-tree';
const astroImportTree = astroImportTreeModule.default || astroImportTreeModule;
```

## API

### `astroImportTree.parse(options)`

Astroプロジェクトを解析してインポートツリーを返します。

#### オプション

- `dir` (string, 必須): Astroプロジェクトのルートディレクトリ
- `pagesDir` (string, オプション): ルートからの相対的なpagesディレクトリ。デフォルトは`'src/pages'`

#### 戻り値

`ImportTree`オブジェクトを解決するPromiseを返します：

```typescript
interface ImportTree {
  pages: ImportTreePage[];
}

interface ImportTreePage {
  path: string;      // URLパス（例："/", "/about"）
  imports: string[]; // インポートパスの配列（例："@src/components/Header.astro"）
}
```

### `astroImportTree.toLLM(tree)`

インポートツリーをLLMフレンドリーなテキスト形式に変換します。

#### パラメータ

- `tree` (ImportTree): `parse()`から取得したインポートツリーオブジェクト

#### 戻り値

各ページのインポート情報をフォーマットした文字列を返します。

## 動作原理

1. **ページ検出**: pagesディレクトリ内のすべての`.astro`ファイルを検索
2. **URLマッピング**: ファイルパスをURLパスに変換（例：`src/pages/about.astro` → `/about`）
3. **インポート分析**: 
   - Astroのfrontmatterからインポートを解析
   - JavaScript/TypeScriptのインポートを分析
   - 相対インポートとエイリアスインポートを追跡
   - 動的インポートと`Astro.glob()`を処理
4. **再帰的トラバース**: すべてのインポートを追跡して完全な依存関係ツリーを構築
5. **出力生成**: データを構造化JSONまたは読みやすいテキストとしてフォーマット

## インポートパスの形式

ライブラリは、すべてのインポートパスをプロジェクトルートからの相対パスに`@`プレフィックスを付けてフォーマットします：

- `@src/pages/index.astro`
- `@src/components/Header.astro`
- `@src/layouts/BaseLayout.astro`

## ライセンス

MIT