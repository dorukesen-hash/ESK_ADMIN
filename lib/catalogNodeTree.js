function findNode(tree, nodeId) {
  for (const node of tree) {
    if (node.id === nodeId) return node
    const found = findNode(node.children ?? [], nodeId)
    if (found) return found
  }
  return null
}

function findAncestors(tree, nodeId) {
  function search(nodes, trail) {
    for (const node of nodes) {
      if (node.id === nodeId) return trail
      const found = search(node.children ?? [], [...trail, node])
      if (found) return found
    }
    return null
  }
  return search(tree, []) ?? []
}

function collectDescendantIds(tree, nodeId) {
  const node = findNode(tree, nodeId)
  if (!node) return []

  const ids = [node.id]
  function walk(children) {
    for (const child of children) {
      ids.push(child.id)
      walk(child.children ?? [])
    }
  }
  walk(node.children ?? [])
  return ids
}

function flattenTreeForPicker(tree, { excludeIds = [] } = {}) {
  const excluded = new Set(excludeIds)
  const result = []

  function walk(nodes, depth) {
    for (const node of nodes) {
      if (excluded.has(node.id)) continue
      result.push({ id: node.id, name: node.name, depth })
      walk(node.children ?? [], depth + 1)
    }
  }

  walk(tree, 0)
  return result
}

module.exports = { findNode, findAncestors, collectDescendantIds, flattenTreeForPicker }
