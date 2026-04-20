/**
 * Feature: fe-refactor-steering
 * プロパティテスト（静的解析ベース）
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');

function readLines(filePath: string): string[] {
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

function getAllTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...getAllTsxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

// Property 2: セマンティックHTML制約
// Validates: Requirements 6.1
describe('Property 2: セマンティックHTML制約', () => {
  const DIV_ONCLICK = /<div[^>]*onClick/;
  // 今回のリファクタリング対象ディレクトリのみ検証
  const targetDirs = [
    'components/notes/NoteForm',
    'components/notes/RuneSelector',
    'components/notes/ChampionSelectorSidebar',
    'app/notes',
  ];
  const targetFiles = targetDirs.flatMap((dir) => {
    const absDir = path.join(SRC, dir);
    if (!fs.existsSync(absDir)) return [];
    return getAllTsxFiles(absDir);
  });

  for (const file of targetFiles) {
    const rel = path.relative(SRC, file);
    it(`${rel} に <div onClick> が存在しない`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(DIV_ONCLICK.test(content)).toBe(false);
    });
  }
});

// Property 3: Public API パターン遵守
// Validates: Requirements 7.1, 7.2, 7.3
describe('Property 3: Public API パターン遵守', () => {
  const subDirs = [
    'components/notes/NoteForm',
    'components/notes/RuneSelector',
    'components/notes/ChampionSelectorSidebar',
    'adapters/supabase',
  ];

  for (const dir of subDirs) {
    const absDir = path.join(SRC, dir);
    it(`${dir}/ に index.ts が存在する`, () => {
      expect(fs.existsSync(path.join(absDir, 'index.ts'))).toBe(true);
    });

    it(`${dir}/index.ts の import は相対パス（./）を使用する`, () => {
      const indexPath = path.join(absDir, 'index.ts');
      if (!fs.existsSync(indexPath)) return;
      const lines = readLines(indexPath).filter(
        (l) => l.trimStart().startsWith('import') || l.includes('export')
      );
      const nonRelative = lines.filter((l) =>
        /from ['"](?!\.\/|\.\.\/)[^'"]+['"]/.test(l)
      );
      expect(nonRelative).toHaveLength(0);
    });
  }
});
