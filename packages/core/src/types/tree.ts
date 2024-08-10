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
  documents: TreeNodeDocument[];
  documentMap: Map<string, TreeNodeDocumentDocument>;
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
  document: TreeNodeDocumentDocument;
};

export type TreeNodeDocumentDocument = {
  id: string;
  path?: string | null;
};
