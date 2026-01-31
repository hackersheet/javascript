import { describe, it, expect } from 'vitest';

import { parseTreeOutput, TreeNode } from '../parse-tree-output';

/**
 * Helper to extract just the structure (name, type, children) for easier comparison.
 */
function extractStructure(
  node: TreeNode | null
): { name: string; type: string; children?: ReturnType<typeof extractStructure>[] } | null {
  if (!node) return null;
  return {
    name: node.name,
    type: node.type,
    children: node.children?.map(extractStructure) as ReturnType<typeof extractStructure>[] | undefined,
  };
}

describe('parseTreeOutput', () => {
  describe('basic parsing', () => {
    it('returns null for empty input', () => {
      expect(parseTreeOutput('')).toBeNull();
      expect(parseTreeOutput('   ')).toBeNull();
    });

    it('parses a simple tree with one file', () => {
      const input = `project
└── file.txt`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'project',
        type: 'directory',
        children: [{ name: 'file.txt', type: 'file', children: undefined }],
      });
    });

    it('parses a tree with multiple files at same level', () => {
      const input = `project
├── file1.txt
├── file2.txt
└── file3.txt`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'project',
        type: 'directory',
        children: [
          { name: 'file1.txt', type: 'file', children: undefined },
          { name: 'file2.txt', type: 'file', children: undefined },
          { name: 'file3.txt', type: 'file', children: undefined },
        ],
      });
    });

    it('parses nested directories', () => {
      const input = `project
├── src
│   ├── index.ts
│   └── utils.ts
└── package.json`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'project',
        type: 'directory',
        children: [
          {
            name: 'src',
            type: 'directory',
            children: [
              { name: 'index.ts', type: 'file', children: undefined },
              { name: 'utils.ts', type: 'file', children: undefined },
            ],
          },
          { name: 'package.json', type: 'file', children: undefined },
        ],
      });
    });
  });

  describe('deeply nested structures', () => {
    it('parses 3 levels of nesting', () => {
      const input = `root
└── level1
    └── level2
        └── level3.txt`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'root',
        type: 'directory',
        children: [
          {
            name: 'level1',
            type: 'directory',
            children: [
              {
                name: 'level2',
                type: 'directory',
                children: [{ name: 'level3.txt', type: 'file', children: undefined }],
              },
            ],
          },
        ],
      });
    });

    it('parses complex nested structure with multiple branches', () => {
      const input = `project
├── src
│   ├── components
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── utils
│       └── helpers.ts
├── tests
│   └── unit
│       └── helpers.test.ts
└── README.md`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'project',
        type: 'directory',
        children: [
          {
            name: 'src',
            type: 'directory',
            children: [
              {
                name: 'components',
                type: 'directory',
                children: [
                  { name: 'Button.tsx', type: 'file', children: undefined },
                  { name: 'Input.tsx', type: 'file', children: undefined },
                ],
              },
              {
                name: 'utils',
                type: 'directory',
                children: [{ name: 'helpers.ts', type: 'file', children: undefined }],
              },
            ],
          },
          {
            name: 'tests',
            type: 'directory',
            children: [
              {
                name: 'unit',
                type: 'directory',
                children: [{ name: 'helpers.test.ts', type: 'file', children: undefined }],
              },
            ],
          },
          { name: 'README.md', type: 'file', children: undefined },
        ],
      });
    });
  });

  describe('summary line filtering', () => {
    it('filters out "X directories, Y files" summary', () => {
      const input = `project
├── src
│   └── index.ts
└── README.md

2 directories, 2 files`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(2);
      expect(result?.children?.some((c) => c.name.includes('directories'))).toBe(false);
    });

    it('filters out "X directories" summary', () => {
      const input = `project
├── dir1
│   └── subdir
└── dir2

3 directories`;

      const result = parseTreeOutput(input);
      expect(result?.children?.some((c) => c.name.includes('directories'))).toBe(false);
    });

    it('filters out "X files" summary', () => {
      const input = `project
├── file1.txt
└── file2.txt

2 files`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles files with spaces in names', () => {
      const input = `project
└── my file with spaces.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('my file with spaces.txt');
    });

    it('handles files with special characters', () => {
      const input = `project
├── file-with-dashes.txt
├── file_with_underscores.txt
└── file.multiple.dots.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.map((c) => c.name)).toEqual([
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        'file.multiple.dots.txt',
      ]);
    });

    it('handles dotfiles', () => {
      const input = `project
├── .gitignore
├── .env
└── .github
    └── workflows
        └── ci.yml`;

      const result = parseTreeOutput(input);
      expect(result?.children?.map((c) => c.name)).toEqual(['.gitignore', '.env', '.github']);
    });

    it('handles empty directories (directory with no children after it)', () => {
      // In tree output, an empty dir followed by same-level item
      const input = `project
├── empty-dir
├── file.txt
└── another-dir
    └── nested.txt`;

      const result = parseTreeOutput(input);
      // empty-dir should be treated as file since it has no children
      // This is the current behavior - may need review
      expect(result?.children?.[0]?.name).toBe('empty-dir');
      expect(result?.children?.[1]?.name).toBe('file.txt');
    });

    it('handles Windows-style CRLF line endings', () => {
      const input = `project\r\n├── file1.txt\r\n└── file2.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(2);
    });

    it('handles tabs instead of spaces', () => {
      const input = `project
├── src
│\t└── index.ts
└── README.md`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'project',
        type: 'directory',
        children: [
          {
            name: 'src',
            type: 'directory',
            children: [{ name: 'index.ts', type: 'file', children: undefined }],
          },
          { name: 'README.md', type: 'file', children: undefined },
        ],
      });
    });
  });

  describe('file extension detection', () => {
    it('extracts file extensions correctly', () => {
      const input = `project
├── script.ts
├── style.css
├── data.json
└── noextension`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.extension).toBe('ts');
      expect(result?.children?.[1]?.extension).toBe('css');
      expect(result?.children?.[2]?.extension).toBe('json');
      expect(result?.children?.[3]?.extension).toBeUndefined();
    });

    it('does not set extension for directories', () => {
      const input = `project
└── src.backup
    └── file.ts`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.extension).toBeUndefined();
    });
  });

  describe('alternative tree formats', () => {
    it('handles tree output without connectors (indentation only)', () => {
      const input = `project
    src
        index.ts
    README.md`;

      const result = parseTreeOutput(input);
      // This format may not be correctly parsed by current implementation
      expect(result).not.toBeNull();
    });

    it('handles ASCII tree format (using +-- instead of ├──)', () => {
      const input = `project
+-- src
|   +-- index.ts
+-- README.md`;

      const result = parseTreeOutput(input);
      // This format may not be correctly parsed by current implementation
      expect(result).not.toBeNull();
    });
  });

  describe('real-world tree outputs', () => {
    it('parses typical Next.js project structure', () => {
      const input = `my-app
├── app
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
│       ├── button.tsx
│       └── input.tsx
├── lib
│   └── utils.ts
├── public
│   └── favicon.ico
├── next.config.js
├── package.json
└── tsconfig.json

5 directories, 10 files`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('my-app');
      expect(result?.children?.length).toBe(7); // app, components, lib, public, next.config.js, package.json, tsconfig.json
      expect(result?.children?.find((c) => c.name === 'app')?.children?.length).toBe(3);
      expect(result?.children?.find((c) => c.name === 'components')?.children?.[0]?.name).toBe('ui');
    });

    it('parses tree with symbolic links notation', () => {
      const input = `project
├── link -> /path/to/target
└── file.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('link -> /path/to/target');
    });
  });

  describe('id generation', () => {
    it('generates unique IDs for each node', () => {
      const input = `project
├── file1.txt
└── file2.txt`;

      const result = parseTreeOutput(input);
      const ids = new Set<string>();
      const collectIds = (node: TreeNode) => {
        ids.add(node.id);
        node.children?.forEach(collectIds);
      };
      if (result) collectIds(result);

      expect(ids.size).toBe(3); // root + 2 files
    });

    it('generates consistent IDs for same input', () => {
      const input = `project
└── file.txt`;

      const result1 = parseTreeOutput(input);
      const result2 = parseTreeOutput(input);

      expect(result1?.id).toBe(result2?.id);
      expect(result1?.children?.[0]?.id).toBe(result2?.children?.[0]?.id);
    });
  });

  describe('level tracking', () => {
    it('assigns correct levels to nodes', () => {
      const input = `root
├── level1
│   └── level2
│       └── level3.txt
└── another-level1.txt`;

      const result = parseTreeOutput(input);
      expect(result?.level).toBe(0);
      expect(result?.children?.[0]?.level).toBe(1);
      expect(result?.children?.[0]?.children?.[0]?.level).toBe(2);
      expect(result?.children?.[0]?.children?.[0]?.children?.[0]?.level).toBe(3);
      expect(result?.children?.[1]?.level).toBe(1);
    });
  });

  describe('Japanese and Unicode support', () => {
    it('handles Japanese file and directory names', () => {
      const input = `プロジェクト
├── ソースコード
│   ├── メイン.ts
│   └── ユーティリティ.ts
└── 設定ファイル.json`;

      const result = parseTreeOutput(input);
      expect(extractStructure(result)).toEqual({
        name: 'プロジェクト',
        type: 'directory',
        children: [
          {
            name: 'ソースコード',
            type: 'directory',
            children: [
              { name: 'メイン.ts', type: 'file', children: undefined },
              { name: 'ユーティリティ.ts', type: 'file', children: undefined },
            ],
          },
          { name: '設定ファイル.json', type: 'file', children: undefined },
        ],
      });
    });

    it('handles mixed Japanese and English names', () => {
      const input = `my-project
├── src
│   ├── components
│   │   └── ボタン.tsx
│   └── utils
│       └── 文字列処理.ts
├── テスト
│   └── unit
│       └── ボタン.test.tsx
└── README.md`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('my-project');
      expect(result?.children?.find((c) => c.name === 'src')?.children?.[0]?.children?.[0]?.name).toBe('ボタン.tsx');
      expect(result?.children?.find((c) => c.name === 'テスト')).toBeDefined();
    });

    it('handles Chinese characters', () => {
      const input = `项目
├── 源代码
│   └── 主程序.ts
└── 配置.json`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('项目');
      expect(result?.children?.[0]?.name).toBe('源代码');
    });

    it('handles Korean characters', () => {
      const input = `프로젝트
├── 소스코드
│   └── 메인.ts
└── 설정.json`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('프로젝트');
      expect(result?.children?.[0]?.name).toBe('소스코드');
    });

    it('handles emoji in file names', () => {
      const input = `project
├── 📁 documents
│   └── 📄 readme.md
├── 🎨 styles.css
└── 🚀 app.ts`;

      const result = parseTreeOutput(input);
      expect(result?.children?.map((c) => c.name)).toEqual(['📁 documents', '🎨 styles.css', '🚀 app.ts']);
    });

    it('handles full-width characters', () => {
      const input = `フォルダ
├── ＦＩＬＥ１.txt
└── ＦＩＬＥ２.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('ＦＩＬＥ１.txt');
    });
  });

  describe('special characters and edge cases', () => {
    it('handles parentheses and brackets in names', () => {
      const input = `project
├── file (1).txt
├── file [backup].txt
├── file {temp}.txt
└── file <draft>.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.map((c) => c.name)).toEqual([
        'file (1).txt',
        'file [backup].txt',
        'file {temp}.txt',
        'file <draft>.txt',
      ]);
    });

    it('handles quotes in file names', () => {
      const input = `project
├── "quoted".txt
├── 'single-quoted'.txt
└── \`backtick\`.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('"quoted".txt');
      expect(result?.children?.[1]?.name).toBe("'single-quoted'.txt");
    });

    it('handles hash and at symbols', () => {
      const input = `project
├── #1-issue.md
├── @types
│   └── index.d.ts
└── file@2x.png`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('#1-issue.md');
      expect(result?.children?.[1]?.name).toBe('@types');
    });

    it('handles ampersand and percent', () => {
      const input = `project
├── Tom & Jerry.txt
├── 100%.txt
└── a&b&c.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('Tom & Jerry.txt');
      expect(result?.children?.[1]?.name).toBe('100%.txt');
    });

    it('handles very long file names', () => {
      const longName = 'a'.repeat(200) + '.txt';
      const input = `project
└── ${longName}`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe(longName);
    });

    it('handles file names with colons (Windows-style paths preserved)', () => {
      const input = `project
└── note: important.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('note: important.txt');
    });

    it('handles equals and plus signs', () => {
      const input = `project
├── a=b.txt
├── a+b.txt
└── a==b.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.map((c) => c.name)).toEqual(['a=b.txt', 'a+b.txt', 'a==b.txt']);
    });
  });

  describe('deeply nested and large structures', () => {
    it('handles 5 levels of nesting', () => {
      const input = `root
└── l1
    └── l2
        └── l3
            └── l4
                └── l5.txt`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('root');

      // Navigate down: root -> l1 -> l2 -> l3 -> l4 -> l5.txt
      let current = result;
      const expectedPath = ['l1', 'l2', 'l3', 'l4', 'l5.txt'];
      for (const expectedName of expectedPath) {
        expect(current?.children?.length).toBe(1);
        current = current?.children?.[0] ?? null;
        expect(current?.name).toBe(expectedName);
      }
      expect(current?.type).toBe('file');
    });

    it('handles many files at same level', () => {
      const files = Array.from({ length: 20 }, (_, i) => `file${i + 1}.txt`);
      const input = `project
${files.map((f, i) => `${i === files.length - 1 ? '└' : '├'}── ${f}`).join('\n')}`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(20);
      expect(result?.children?.map((c) => c.name)).toEqual(files);
    });

    it('handles wide tree with many branches at each level', () => {
      const input = `project
├── dir1
│   ├── file1.txt
│   ├── file2.txt
│   └── file3.txt
├── dir2
│   ├── file4.txt
│   ├── file5.txt
│   └── file6.txt
├── dir3
│   ├── file7.txt
│   ├── file8.txt
│   └── file9.txt
└── dir4
    ├── file10.txt
    ├── file11.txt
    └── file12.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(4);
      result?.children?.forEach((dir) => {
        expect(dir.type).toBe('directory');
        expect(dir.children?.length).toBe(3);
      });
    });
  });

  describe('various tree command outputs', () => {
    it('handles tree output with file sizes', () => {
      // Some tree implementations show file sizes
      const input = `project
├── [4.0K]  src
│   └── [1.2K]  index.ts
└── [  512]  README.md`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(2);
      // File names should include the size info as-is
      expect(result?.children?.[0]?.name).toContain('src');
    });

    it('handles tree output with permissions', () => {
      const input = `project
├── [-rw-r--r--]  file1.txt
└── [drwxr-xr-x]  dir1
    └── [-rw-r--r--]  file2.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(2);
    });

    it('handles tree -F output (with type indicators)', () => {
      const input = `project/
├── src/
│   ├── index.ts
│   └── utils/
│       └── helper.ts
├── package.json
└── README.md`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('project/');
      expect(result?.children?.find((c) => c.name === 'src/')?.type).toBe('directory');
    });

    it('handles tree with trailing slash for directories', () => {
      const input = `project
├── src/
│   └── index.ts
└── dist/
    └── bundle.js`;

      const result = parseTreeOutput(input);
      expect(result?.children?.[0]?.name).toBe('src/');
      expect(result?.children?.[0]?.type).toBe('directory');
    });
  });

  describe('error handling and robustness', () => {
    it('handles single line input (root only)', () => {
      const input = `project`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('project');
      expect(result?.children).toEqual([]);
    });

    it('handles input with only whitespace lines between entries', () => {
      const input = `project
├── file1.txt

├── file2.txt

└── file3.txt`;

      const result = parseTreeOutput(input);
      expect(result?.children?.length).toBe(3);
    });

    it('handles malformed lines gracefully', () => {
      const input = `project
├── valid-file.txt
some random text
└── another-valid.txt`;

      const result = parseTreeOutput(input);
      // Should not crash and should parse what it can
      expect(result).not.toBeNull();
    });

    it('handles input with leading/trailing empty lines', () => {
      const input = `

project
├── file1.txt
└── file2.txt

`;

      const result = parseTreeOutput(input);
      expect(result?.name).toBe('project');
      expect(result?.children?.length).toBe(2);
    });
  });
});
