const test = require('node:test')
const assert = require('node:assert/strict')
const {
  findNode,
  findAncestors,
  collectDescendantIds,
  flattenTreeForPicker,
} = require('./catalogNodeTree')

const SAMPLE_TREE = [
  {
    id: 1,
    name: 'Category',
    parentId: null,
    children: [
      {
        id: 2,
        name: 'Subcategory',
        parentId: 1,
        children: [
          { id: 3, name: 'Product', parentId: 2, children: [], variants: [] },
        ],
        variants: [],
      },
    ],
    variants: [],
  },
  { id: 4, name: 'OtherRoot', parentId: null, children: [], variants: [] },
]

test('findNode: finds a node at any depth', () => {
  assert.equal(findNode(SAMPLE_TREE, 3)?.name, 'Product')
  assert.equal(findNode(SAMPLE_TREE, 1)?.name, 'Category')
})

test('findNode: returns null for an unknown id', () => {
  assert.equal(findNode(SAMPLE_TREE, 999), null)
})

test('findAncestors: root-first, excluding the node itself', () => {
  const ancestors = findAncestors(SAMPLE_TREE, 3)
  assert.deepEqual(ancestors.map((n) => n.id), [1, 2])
})

test('findAncestors: a root node has no ancestors', () => {
  assert.deepEqual(findAncestors(SAMPLE_TREE, 1), [])
})

test('findAncestors: an unknown id has no ancestors', () => {
  assert.deepEqual(findAncestors(SAMPLE_TREE, 999), [])
})

test('collectDescendantIds: includes the node itself and every descendant, at any depth', () => {
  const ids = collectDescendantIds(SAMPLE_TREE, 1)
  assert.deepEqual([...ids].sort((a, b) => a - b), [1, 2, 3])
})

test('collectDescendantIds: a leaf with no children returns just itself', () => {
  assert.deepEqual(collectDescendantIds(SAMPLE_TREE, 3), [3])
})

test('collectDescendantIds: a sibling subtree is excluded', () => {
  assert.deepEqual(collectDescendantIds(SAMPLE_TREE, 4), [4])
})

test('collectDescendantIds: an unknown id returns an empty array', () => {
  assert.deepEqual(collectDescendantIds(SAMPLE_TREE, 999), [])
})

test('flattenTreeForPicker: depth-first, with each entry\'s depth', () => {
  const flat = flattenTreeForPicker(SAMPLE_TREE)
  assert.deepEqual(
    flat.map((e) => [e.id, e.depth]),
    [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 0],
    ]
  )
})

test('flattenTreeForPicker: excludeIds removes the node AND its whole subtree', () => {
  const flat = flattenTreeForPicker(SAMPLE_TREE, { excludeIds: [2] })
  // Node 2 and its descendant (3) are both gone; node 1 and 4 remain.
  assert.deepEqual(flat.map((e) => e.id), [1, 4])
})

test('flattenTreeForPicker: excluding a root does not affect an unrelated root', () => {
  const flat = flattenTreeForPicker(SAMPLE_TREE, { excludeIds: [1] })
  assert.deepEqual(flat.map((e) => e.id), [4])
})

test('flattenTreeForPicker: an empty tree returns an empty list', () => {
  assert.deepEqual(flattenTreeForPicker([]), [])
})
