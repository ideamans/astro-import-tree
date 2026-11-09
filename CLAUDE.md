# このプロジェクトは

Astro のページ(例: src/pages/index.astro)の URL パスと、インポートツリーを AST を使い解析して、構造データやテキストを生成するライブラリです。

## 利用技術

- TypeScript

## 例

```typescript
import AstroImportTree from 'astro-import-tree';

const tree = await AstroImportTree.parse({
  dir: './',
})

console.log(tree)

console.log(AstroImportTree.toLLM(tree));

--- 結果 (オブジェクト)

{
  "pages": [
    {
      "path": "/",
      "imports": [
        "@src/pages/index.astro",
        "@src/components/Header.astro",
        "@src/components/Hero.astro",
        "@src/components/Hero/Image.astro",
        "@src/components/Footer.astro"
      ]
    },
    {
      "path": "/about",
      "imports": [
        "@src/pages/about.astro",
        "@src/components/Header.astro",
        "@src/components/Footer.astro"
      ]
    }
  ]
}

--- 結果 (LLM用テキスト)

## /, /index.html

- @src/pages/index.astro
- @src/components/Header.astro
- @src/components/Hero.astro
- @src/components/Hero/Image.astro
- @src/components/Footer.astro

## /about, /about/index.html

- @src/pages/about.astro
- @src/components/Header.astro
- @src/components/Footer.astro

```

## 初期開発

- AstroImportTree を開発する
- testdata/astro でテストを開発する(ava)
- テストがパスするように調整する
- README.md(英語)、README.ja.md(日本語)を作成する
- LICENSE を作成する(MIT)
- GitHub Acitons を用意する(Node.js 20/22/24 でテストが通ることを確認するシンプルなもの)

## npm への公開

`v*` のタグを push すると `.github/workflows/publish.yml` がテストとビルドのあと npm に**そのまま公開する**
（承認待ちにしない）。認証は npm の Trusted Publishing（GitHub Actions の OIDC）で、`NPM_TOKEN` などのシークレットは使わない。
provenance は自動で付く。

```bash
# package.json の version を上げてコミット・push してから
git tag vX.Y.Z && git push origin vX.Y.Z
```

- タグと package.json の version が違えば落ちる。npm に同じ版があれば何もしない
- プレリリース（`1.2.0-beta.0`）は `latest` ではなく識別子の dist-tag（`beta`）で出る
- 手元から `npm publish` しない（トークンを置かない）
- タグを打ち直さずに出し直すときは、Actions の「Publish to npm」を workflow_dispatch で起動する（選んだブランチの package.json の版を出す）
- PR で `publish.yml` を変えると、公開せずにビルドと `npm pack --dry-run` までが走る
- package.json の `repository` はこのリポジトリを指すこと。provenance の検証で照合され、違うと公開が `E422` で落ちる（ワークフローが先に検査する）
- 前提: npmjs.com の `astro-import-tree` の設定で、Trusted Publisher に GitHub Actions・`ideamans/astro-import-tree`・`publish.yml`・権限 **publish** を登録してあること。
  stage publish の権限だけだと `npm publish` は `E403 OIDC permission denied` になる
