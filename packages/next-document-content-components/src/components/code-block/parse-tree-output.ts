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
 * Patterns for tree connectors (branch and last-branch indicators).
 * Supports both Unicode box-drawing characters and ASCII equivalents.
 */
const CONNECTOR_PATTERNS = [
  /├──? ?/, // Unicode branch (├── or ├─)
  /└──? ?/, // Unicode last branch (└── or └─)
  /\+--? ?/, // ASCII branch (+-- or +-)
  /\\--? ?/, // ASCII last branch (\-- or \-)
];

/**
 * Finds the first connector in the line and returns its position and length.
 * Returns null if no connector is found.
 */
function findConnector(line: string): { index: number; length: number } | null {
  for (const pattern of CONNECTOR_PATTERNS) {
    const match = line.match(pattern);
    if (match && match.index !== undefined) {
      return { index: match.index, length: match[0].length };
    }
  }
  return null;
}

/**
 * Counts the number of vertical line characters in the prefix portion.
 * Supports both Unicode (│) and ASCII (|) vertical lines.
 */
function countVerticalLines(prefix: string): number {
  const matches = prefix.match(/[│|]/g);
  return matches ? matches.length : 0;
}

/**
 * Counts prefix units in a string.
 * A prefix unit is typically 4 characters wide and can be:
 * - A vertical line (│ or |) followed by spaces (e.g., "│   ")
 * - 4 consecutive spaces (e.g., "    ")
 *
 * The algorithm uses the maximum of:
 * - Number of vertical lines (for standard tree output)
 * - Total prefix length / 4 (for space-based indentation)
 *
 * This handles various cases:
 * - "│   │   " → 2 units (2 vertical lines)
 * - "        " → 2 units (8 chars / 4)
 * - "│       " → 2 units (8 chars / 4, even with only 1 vertical line)
 */
function countPrefixUnits(prefix: string): number {
  const verticalLineCount = countVerticalLines(prefix);
  const lengthBasedCount = Math.floor(prefix.length / 4);

  // Use the maximum to handle cases where vertical lines are sparse
  // (e.g., "│       " should be 2 units, not 1)
  return Math.max(verticalLineCount, lengthBasedCount);
}

/**
 * Parses a single line from tree command output.
 * Returns the indentation level and the node name.
 *
 * The level is determined by analyzing the prefix portion before the connector:
 * - Count vertical line characters (│ or |) when present
 * - Fall back to counting 4-space units for indentation-only formats
 *
 * @example
 * - "root" → level 0
 * - "├── file" → level 1 (0 prefix units + connector)
 * - "│   ├── file" → level 2 (1 vertical line + connector)
 * - "    └── file" → level 2 (4 spaces = 1 unit + connector)
 * - "│   │   └── file" → level 3 (2 vertical lines + connector)
 */
function parseLine(line: string): { level: number; name: string } {
  const normalized = normalizeTabs(line);
  const connectorInfo = findConnector(normalized);

  if (connectorInfo) {
    const prefix = normalized.slice(0, connectorInfo.index);
    const afterConnector = normalized.slice(connectorInfo.index + connectorInfo.length);
    const prefixUnits = countPrefixUnits(prefix);

    // Level = number of prefix units + 1 (for the connector itself)
    const level = prefixUnits + 1;
    const name = afterConnector.trim();

    return { level, name };
  }

  // No connector found - this is likely the root or a line with only indentation
  const prefixUnits = countPrefixUnits(normalized);
  const name = normalized.replace(/^[│├└─|+\\\-\s]+/, '').trim() || normalized.trim();

  return { level: prefixUnits, name };
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
