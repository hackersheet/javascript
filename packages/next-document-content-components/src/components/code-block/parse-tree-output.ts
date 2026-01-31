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
function hashSha256(str: string): string {
  const hash = createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}

/**
 * Checks if a line is a tree summary line (e.g., "3 directories, 5 files").
 */
function isSummaryLine(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:\d+\s+directories?,\s*\d+\s+files?|\d+\s+directories?|\d+\s+files?)$/i.test(trimmed);
}

/**
 * Normalizes tab characters in a line.
 * - Replaces │\t or |\t with vertical line + 3 spaces (4 chars total)
 * - Replaces remaining tabs with 4 spaces
 */
function normalizeTabs(line: string): string {
  return line.replace(/│\t/g, '│   ').replace(/\|\t/g, '|   ').replace(/\t/g, '    ');
}

/**
 * Pattern for 4-character prefix units before the connector.
 * Unicode: "│   " or "    "
 * ASCII: "|   " or "    "
 */
const PREFIX_UNIT_PATTERN = /^(│ {3}|\| {3}| {4})/;

/**
 * Patterns for tree connectors.
 */
const CONNECTOR_PATTERNS = [
  /^├── ?/, // Unicode branch
  /^└── ?/, // Unicode last branch
  /^├─ ?/, // Shorter Unicode variant
  /^└─ ?/, // Shorter Unicode variant
  /^\+-- ?/, // ASCII branch
  /^\\-- ?/, // ASCII last branch
];

/**
 * Recursively counts and removes prefix units from the beginning of a line.
 */
function countAndRemovePrefixes(line: string, count: number = 0): { remaining: string; prefixCount: number } {
  const match = line.match(PREFIX_UNIT_PATTERN);
  if (match) {
    return countAndRemovePrefixes(line.slice(match[0].length), count + 1);
  }
  return { remaining: line, prefixCount: count };
}

/**
 * Checks if the line starts with a connector and removes it.
 */
function checkAndRemoveConnector(line: string): { remaining: string; hasConnector: boolean } {
  const matchingPattern = CONNECTOR_PATTERNS.find((pattern) => pattern.test(line));
  if (matchingPattern) {
    const match = line.match(matchingPattern);
    return { remaining: line.slice(match![0].length), hasConnector: true };
  }
  return { remaining: line, hasConnector: false };
}

/**
 * Parses a single line from tree command output.
 * Returns the indentation level and the node name.
 *
 * Standard tree format:
 * - Root: no prefix
 * - Level 1: ├── or └── (preceded by nothing)
 * - Level 2: │   ├── or │   └── or     ├── or     └── (one 4-char prefix)
 * - Level 3: │   │   ├── etc. (two 4-char prefixes)
 */
function parseLine(line: string): { level: number; name: string } {
  const normalized = normalizeTabs(line);
  const { remaining: afterPrefixes, prefixCount } = countAndRemovePrefixes(normalized);
  const { remaining: afterConnector, hasConnector } = checkAndRemoveConnector(afterPrefixes);

  // Calculate level: prefix count + 1 if there's a connector
  const level = hasConnector ? prefixCount + 1 : prefixCount;

  // Clean any remaining box-drawing characters and trim
  const name = afterConnector.replace(/^[│├└─|+\\\-\s]+/, '').trim() || afterConnector.trim();

  return { level, name };
}

type ParsedLine = { level: number; name: string };

/**
 * Computes the next non-empty line's level for each line.
 * Used to determine if a node is a directory (has children).
 */
function computeNextLevels(parsedLines: ParsedLine[]): (number | null)[] {
  return parsedLines.map((_, index) => {
    const nextLineWithName = parsedLines.slice(index + 1).find((line) => line.name);
    return nextLineWithName?.level ?? null;
  });
}

/**
 * Gets file extension from a filename.
 */
function getExtension(filename: string): string | undefined {
  return filename.match(/\.(\w+)$/)?.[1];
}

/**
 * Creates a TreeNode from parsed line data.
 */
function createNode(parsedLine: ParsedLine, index: number, idPrefix: string, isDirectory: boolean): TreeNode {
  return {
    id: index === 0 ? idPrefix + 'root' : idPrefix + 'node-' + index,
    name: parsedLine.name,
    type: isDirectory ? 'directory' : 'file',
    extension: isDirectory ? undefined : getExtension(parsedLine.name),
    level: parsedLine.level,
    children: isDirectory ? [] : undefined,
  };
}

/**
 * Finds the parent node for a given level by traversing the stack.
 * Returns a new stack with nodes popped until we find the correct parent.
 */
function findParentStack(
  stack: Array<{ node: TreeNode; level: number }>,
  level: number
): Array<{ node: TreeNode; level: number }> {
  if (stack.length <= 1 || stack[stack.length - 1].level < level) {
    return stack;
  }
  return findParentStack(stack.slice(0, -1), level);
}

/**
 * Builds the tree structure from parsed lines using reduce.
 */
function buildTree(parsedLines: ParsedLine[], nextLevels: (number | null)[], idPrefix: string): TreeNode {
  const rootLine = parsedLines[0];
  const rootNode = createNode({ ...rootLine, level: 0 }, 0, idPrefix, true);

  const result = parsedLines.slice(1).reduce(
    (acc, parsedLine, idx) => {
      const index = idx + 1; // Adjust for slice(1)
      if (!parsedLine.name) return acc;

      const nextLevel = nextLevels[index];
      const isDirectory = nextLevel !== null && nextLevel > parsedLine.level;
      const newNode = createNode(parsedLine, index, idPrefix, isDirectory);

      // Find the correct parent
      const newStack = findParentStack(acc.stack, parsedLine.level);
      const parent = newStack[newStack.length - 1].node;

      // Add to parent's children (mutating children array is acceptable here
      // since we're building the tree and the node is not yet exposed)
      parent.children = parent.children ?? [];
      parent.children.push(newNode);

      // Update stack if this is a directory
      const updatedStack = isDirectory ? [...newStack, { node: newNode, level: parsedLine.level }] : newStack;

      return { ...acc, stack: updatedStack };
    },
    { root: rootNode, stack: [{ node: rootNode, level: 0 }] as Array<{ node: TreeNode; level: number }> }
  );

  return result.root;
}

/**
 * Parses the output of a `tree` command (including box-drawing characters)
 * and returns a TreeNode tree structure.
 *
 * @remarks
 * - Supports both Unicode box-drawing (│, ├, └, ─) and ASCII (|, +, \, -) formats.
 * - Handles mixed tabs and spaces in indentation.
 * - Automatically excludes summary lines at the end (e.g., `3 directories, 5 files`).
 * - Automatically excludes empty lines.
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
  // Normalize input: remove carriage returns and trim
  const raw = treeOutput.replace(/\r/g, '').trim();
  if (!raw) return null;

  const lines = raw.split('\n');

  // Filter out empty lines and summary lines
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed !== '' && !isSummaryLine(line);
  });

  if (filteredLines.length === 0) return null;

  const idPrefix = 'tree-' + hashSha256(raw) + '-';

  // Parse all lines to extract level and name
  const parsedLines = filteredLines.map(parseLine);

  // Pre-compute next line's level for directory detection
  const nextLevels = computeNextLevels(parsedLines);

  try {
    return buildTree(parsedLines, nextLevels, idPrefix);
  } catch {
    return null;
  }
}

export default parseTreeOutput;
