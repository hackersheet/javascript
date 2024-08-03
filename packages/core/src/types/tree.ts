export type Tree = {
  id: string;
  slug: string;
  name: string;
  nodes: TreeNode[];
  flatNodes: TreeNode[];
};

export type TreeNode = {
  id: string;
  fullSlug: string;
  defaultName: string;
  parentId?: string;
  root: boolean;
  position: number;
  children?: TreeNode[];
};
