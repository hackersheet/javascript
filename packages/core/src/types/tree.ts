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
  name: string;
  names: TreeNodeName[];
  nameMap: Map<string, string>;
  document: TreeNodeDocumentDocument | null;
  documentMap: Map<string, TreeNodeDocumentDocument | null>;
  nodeDocuments: TreeNodeDocument[];
  parentId?: string;
  root: boolean;
  position: number;
  children?: TreeNode[];
};

export type TreeNodeName = {
  variant: string;
  content: string;
};

export type TreeNodeDocument = {
  variant: string;
  document?: TreeNodeDocumentDocument | null;
};

export type TreeNodeDocumentDocument = {
  id: string;
  slug: string;
  title: string;
  path?: string | null;
};
