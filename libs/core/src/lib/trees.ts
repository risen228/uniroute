export interface Tree<L> {
  [key: string]: L | Tree<L>
}

const stop = Symbol('Stop')

interface TraverseOptions<T> {
  tree: Tree<T>
  isLeaf: (value: unknown) => value is T
  callback: (params: {
    node: T
    name: string
    parentPath: string[]
  }) => typeof stop | void
  parentPath?: string[]
}

function traverse<T>({
  tree,
  isLeaf,
  callback,
  parentPath = [],
}: TraverseOptions<T>) {
  for (const [name, node] of Object.entries(tree)) {
    if (isLeaf(node)) {
      const signal = callback({ node, name, parentPath })
      if (signal === stop) break
    } else {
      traverse({
        tree: node,
        isLeaf,
        callback,
        parentPath: parentPath.concat(name),
      })
    }
  }
}

function get<T>(
  tree: Tree<T>,
  path: string[],
  isLeaf: (value: unknown) => value is T,
): T | null {
  const [segment, ...rest] = path

  if (rest.length === 0) {
    const node = tree[segment]
    if (!isLeaf(node)) return null
    return node
  }

  const subTree = tree[segment] ?? {}
  tree[segment] = subTree
  return get(subTree, rest, isLeaf)
}

function set<T>(tree: Tree<T>, path: string[], value: T) {
  const [segment, ...rest] = path

  if (rest.length === 0) {
    tree[segment] = value
  } else {
    const subTree = tree[segment] ?? {}
    tree[segment] = subTree
    set(subTree, rest, value)
  }
}

export const trees = {
  traverse,
  get,
  set,
  signals: {
    stop,
  },
}
