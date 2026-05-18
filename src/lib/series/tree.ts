// Utilitários puros para montar e percorrer a árvore de séries.

export interface SeriesFlat {
  id: string;
  title: string;
  parent_id: string | null;
  sermon_count: number;
}

export interface SeriesNode extends SeriesFlat {
  depth: number;
  children: SeriesNode[];
}

/** Constrói árvore a partir de lista plana. Séries cujo pai não existe
 *  (parent_id quebrado) são tratadas como raiz. */
export function buildSeriesTree(rows: SeriesFlat[]): SeriesNode[] {
  const byId = new Map<string, SeriesNode>();
  for (const row of rows) {
    byId.set(row.id, { ...row, depth: 0, children: [] });
  }
  const roots: SeriesNode[] = [];
  for (const row of rows) {
    const node = byId.get(row.id);
    if (!node) continue;
    const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // Calcula depth recursivamente + ordena por título dentro de cada nível.
  function assign(node: SeriesNode, depth: number) {
    node.depth = depth;
    node.children.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    for (const c of node.children) assign(c, depth + 1);
  }
  roots.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  for (const r of roots) assign(r, 0);
  return roots;
}

/** Achatado de pré-ordem da árvore. Útil para selects (com indentação por depth). */
export function flattenTree(roots: SeriesNode[]): SeriesNode[] {
  const out: SeriesNode[] = [];
  function walk(node: SeriesNode) {
    out.push(node);
    for (const c of node.children) walk(c);
  }
  for (const r of roots) walk(r);
  return out;
}

/** IDs descendentes (excluindo o próprio) — pra impedir mover pasta pra dentro de si. */
export function descendantIds(node: SeriesNode): Set<string> {
  const out = new Set<string>();
  function walk(n: SeriesNode) {
    for (const c of n.children) {
      out.add(c.id);
      walk(c);
    }
  }
  walk(node);
  return out;
}
