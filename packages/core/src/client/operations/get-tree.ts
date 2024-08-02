import { OperationResult } from '@urql/core';

import { graphql } from '../../gql';
import { QueryTreeArgs, TreeQuery } from '../../gql/graphql';
import { Tree, TreeNode } from '../../types/tree';
import { toArrayFromEdges } from '../../utils';

graphql(`
  query tree($slug: String) {
    tree(slug: $slug) {
      id
      slug
      name
      nodes {
        edges {
          node {
            id
            fullSlug
            defaultName
            parent {
              id
            }
            root
            position
          }
        }
      }
    }
  }
`);

export function makeGetTreeResponse(result: OperationResult<TreeQuery, QueryTreeArgs>) {
  if (!result.data?.tree) {
    return { tree: null, error: result.error };
  }

  const tmpTree = result.data?.tree;

  const tree: Tree = {
    ...tmpTree,
    nodes: makeChildren(
      toArrayFromEdges(tmpTree.nodes?.edges).map((node) => ({
        id: node.id,
        fullSlug: node.fullSlug,
        defaultName: node.defaultName,
        parentId: node.parent?.id ?? undefined,
        root: node.root,
        position: node.position ?? undefined,
      }))
    ),
    flatNodes: toArrayFromEdges(tmpTree.nodes?.edges).map((node) => ({
      id: node.id,
      fullSlug: node.fullSlug,
      defaultName: node.defaultName,
      parentId: node.parent?.id ?? undefined,
      root: node.root,
      position: node.position ?? undefined,
    })),
  };
  const error = result.error;

  return { tree, error } as const;
}

function makeChildren(nodes: TreeNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  nodes.forEach((node) => {
    map.set(node.id, {
      ...node,
      children: [],
    });
  });

  nodes.forEach((node) => {
    const treeNode = map.get(node.id);
    if (node.parentId) {
      const parentNode = map.get(node.parentId);
      parentNode?.children?.push(treeNode!);
    } else {
      roots.push(treeNode!);
    }
  });

  return roots;
}
