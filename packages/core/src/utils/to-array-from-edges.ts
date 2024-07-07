import { nonNullableFilter } from './non-nullable-filter';

type Edges<T> =
  | ({
      node?: T | null | undefined;
    } | null)[]
  | null
  | undefined;

export default function toArrayFromEdges<T>(edges: Edges<T>) {
  if (!edges) return [];

  return edges.map((edge) => edge?.node).filter(nonNullableFilter) ?? [];
}
