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
 * Computes the SHA-256 hash of a given string and returns it as a hex string.
 *
 * @param str - The input string to hash
 * @returns The SHA-256 digest in hexadecimal format
 */
function hashSha256(str: string) {
  const hash = createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}

/**
 * Parses the output of a `tree` command (including box-drawing characters)
 * and returns a TreeNode tree structure.
 *
 * @remarks
 * - Expects standard output from the Linux/macOS `tree` command.
 * - Parses box-drawing characters (`│`, `├`, `└`, `─`) and 4-space indentation
 *   to determine hierarchy levels.
 * - Automatically excludes summary lines at the end (e.g., `3 directories, 5 files`).
 * - Uses the rule that only lines with children are considered directories
 *   (lines without children are treated as files).
 * - Returns `null` if an exception occurs during parsing
 *   (callers should handle fallback rendering).
 *
 * @param treeOutput - The complete text output from the `tree` command
 * @returns The root `TreeNode` on success, or `null` on failure or empty input
 *
 * @complexity O(n) - Processes in a single pass over n input lines
 *   (with an additional reverse pass, so memory usage is O(n)).
 */
export function parseTreeOutput(treeOutput: string): TreeNode | null {
  // Normalize input and split into lines
  const raw = treeOutput.replace(/\r/g, '').trim();
  if (!raw) return null;
  const lines = raw.split('\n');

  // Filter out summary lines output by the `tree` command (e.g., "3 directories, 5 files")
  const filteredLines = lines.filter(
    (l) => !/^\s*(?:\d+\s+directories?,\s*\d+\s+files?|\d+\s+directories?|\d+\s+files?)\s*$/i.test(l)
  );

  const idPrefix = 'tree-' + hashSha256(raw) + '-';

  // Initialize root node
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
     * Regular expression for parsing standard `tree` command line format.
     * - prefix: repetitions of '│   ' or 4 spaces
     * - connector: '├── ' or '└── '
     */
    const treeLineRegex = /^(?<prefix>(?:│\s{3}|\s{4})*)(?<connector>├── |└── )?(?<name>.*)$/;

    // Pre-compute name and level for each line (for backward reference)
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
      // Lines not matching the format are treated as level 0 standalone lines
      return { rawLine: normalized, level: 0, cleanedName: cleanNodeName(normalized.trim()) };
    });

    // Pre-compute the next non-empty line's level for each line
    // to eliminate per-node lookahead loops and achieve O(n) behavior
    const reduceResult = lineInfos.reduceRight(
      (acc, info) => ({
        lastLevel: info.rawLine.trim() ? info.level : acc.lastLevel,
        nextLevels: [acc.lastLevel, ...acc.nextLevels],
      }),
      { lastLevel: null as number | null, nextLevels: [] as (number | null)[] }
    );
    const nextNonEmptyLevel = reduceResult.nextLevels;

    // Build the tree from pre-computed info (using forEach for readability)
    lineInfos.forEach((info, index) => {
      const level = info.level;
      const cleanedLine = info.cleanedName;

      // Treat the first level 0 line as the root name
      if (level === 0 && rootNode.name === '') {
        rootNode.name = cleanedLine;
        return;
      }

      // Rule: only treat as directory if a child (lower level) exists
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

      // Use stack to determine parent node
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack[stack.length - 1] === undefined) {
        throw new Error('Tree parsing failed');
      }

      const parentNode = stack[stack.length - 1].node;
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);

      // Push directories onto stack (to receive children)
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
