import { createHash } from 'crypto';

export type TreeNode = {
  id: string;
  name: string;
  type: 'file' | 'directory';
  extension?: string;
  level: number;
  children?: TreeNode[];
};

/**
 * 与えられた文字列の SHA-256 ハッシュを計算して hex 文字列で返します。
 * @param str - ハッシュ化する入力文字列
 * @returns hex 形式の SHA-256 ダイジェスト
 */
function encryptSha256(str: string) {
  const hash = createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}

/**
 * `tree` コマンドの出力（box-drawing を含むテキスト）をパースして TreeNode のツリー構造を返します。
 *
 * @remarks
 * - 入力は Linux/macOS の `tree` コマンドの標準出力を想定しています。
 * - 行先頭の箱線文字（`│`, `├`, `└`, `─`）や 4 スペースインデントを解析して階層を決定します。
 * - 最後に出力されるサマリ行（例: `3 directories, 5 files`）は自動的に除外します。
 * - 子要素が存在する行のみをディレクトリと見なすルールを採用しています（子要素が無ければファイル）。
 * - 解析中に例外が発生した場合は `null` を返します（呼び出し元でフォールバック処理を行ってください）。
 *
 * @param treeOutput - `tree` コマンドで得られたテキスト全体
 * @returns 解析に成功した場合はルート `TreeNode`、失敗または空入力の場合は `null`
 *
 * @complexity O(n) - 入力行数 n に対して一度の走査で処理します（追加で逆順集計を行うためメモリは O(n)）。
 */
export function parseTreeOutput(treeOutput: string): TreeNode | null {
  // 入力を正規化して行に分割する
  const raw = treeOutput.replace(/\r/g, '').trim();
  if (!raw) return null;
  const lines = raw.split('\n');

  // `tree` コマンドが末尾に出力するサマリ行（"3 directories, 5 files" 等）を除外する
  const filteredLines = lines.filter(
    (l) => !/^\s*(?:\d+\s+directories?,\s*\d+\s+files?|\d+\s+directories?|\d+\s+files?)\s*$/i.test(l)
  );

  const idPrefix = 'tree-' + encryptSha256(raw) + '-';

  // ルートノードを初期化
  const rootNode: TreeNode = {
    id: idPrefix + 'root',
    name: '',
    type: 'directory',
    level: 0,
    children: [],
  };
  const stack: { node: TreeNode; level: number }[] = [{ node: rootNode, level: 0 }];

  const getExtension = (filename: string): string | undefined => filename.match(/\.(\w+)$/)?.[1];

  const cleanNodeName = (name: string): string => name.replace(/^[\s│├└─]+/, '').trim();

  try {
    /**
     * `tree` の一般的な行フォーマットを処理するための正規表現。
     * - prefix: '│   ' または 4 スペースの繰り返し
     * - connector: '├── ' または '└── '
     */
    const treeLineRegex = /^(?<prefix>(?:│\s{3}|\s{4})*)(?<connector>├── |└── )?(?<name>.*)$/;

    // 各行から名前とレベルを計算して事前に格納する（後方参照のため）
    const lineInfos = filteredLines.map((ln) => {
      const normalized = ln.replace(/\t/g, '    ');
      const m = normalized.match(treeLineRegex);
      if (m && m.groups) {
        const prefix = m.groups['prefix'] || '';
        const connector = m.groups['connector'] || '';
        const name = (m.groups['name'] || '').trim();
        const groupMatches = prefix.match(/(?:│\s{3}|\s{4})/g);
        const level = (groupMatches ? groupMatches.length : 0) + (connector ? 1 : 0);
        return { rawLine: normalized, level, cleanedName: cleanNodeName(name) };
      }
      // フォーマットに合わない行はレベル0 の単独行として扱う
      return { rawLine: normalized, level: 0, cleanedName: cleanNodeName(normalized.trim()) };
    });

    // 各行について、次に出現する非空行のレベルを事前計算することで
    // per-node のルックアヘッドループを排除し O(n) の振る舞いにする
    const reduceResult = lineInfos.reduceRight(
      (acc, info) => ({
        lastLevel: info.rawLine.trim() ? info.level : acc.lastLevel,
        nextLevels: [acc.lastLevel, ...acc.nextLevels],
      }),
      { lastLevel: null as number | null, nextLevels: [] as (number | null)[] }
    );
    const nextNonEmptyLevel = reduceResult.nextLevels;

    // 事前計算した情報からツリーを構築する（forEach で可読性を保つ）
    lineInfos.forEach((info, index) => {
      const level = info.level;
      const cleanedLine = info.cleanedName;

      // 最初に出てくるレベル0 の行をルート名として扱う
      if (level === 0 && rootNode.name === '') {
        rootNode.name = cleanedLine;
        return;
      }

      // 新ルール: 下位レベル（子）が存在する場合のみディレクトリと判定する
      const nextLevelForLine = nextNonEmptyLevel[index];
      const isDirectory = nextLevelForLine != null && nextLevelForLine > level;

      const newNode: TreeNode = {
        id: idPrefix + 'node-' + index,
        name: cleanedLine,
        type: isDirectory ? 'directory' : 'file',
        extension: isDirectory ? undefined : getExtension(cleanedLine),
        level,
        children: isDirectory ? [] : undefined,
      };

      // スタックを使って親ノードを決定する
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack[stack.length - 1] === undefined) {
        throw new Error('Tree parsing failed');
      }

      const parentNode = stack[stack.length - 1].node;
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);

      // ディレクトリならスタックに積む（子を受け入れるため）
      if (newNode.type === 'directory') {
        stack.push({ node: newNode, level });
      }
    });

    return rootNode;
  } catch {
    return null;
  }
}

export default parseTreeOutput;
