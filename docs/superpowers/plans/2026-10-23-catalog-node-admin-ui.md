# ESK_ADMIN Catalog UI: Unlimited-Depth Node Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Catalog page's fixed-depth Category → Subcategory → Product browser with a generic, arbitrary-depth node browser, consuming the `catalog_node` API added in ESK_API.

**Architecture:** One bulk `GET /admin/catalog-node` call (small catalog — 48 nodes today) replaces the three separate bulk category/subcategory/product fetches the page used before; the whole tree is cached client-side and every navigation (current node, breadcrumb, children) is derived from it by walking `parentId`, the same way the old page derived category/subcategory/product from three flat lists. A single `?node=<id>` query param (replacing the old `?category=&subcategory=&product=`) names the currently-browsed node — self-healing, since ancestors are always re-walked from the tree rather than trusted from the URL. Three fixed-depth form modals and three fixed-depth list sections collapse into one generic form, one generic list section, and one reusable node picker (a flattened, indented `<select>` — the real catalog has no depth or breadth that needs a collapsible tree widget).

**Tech Stack:** Next.js 14, React 18, `@tanstack/react-query`, `react-hook-form` + `yup`, Node's built-in `node:test` for the one pure-logic module this plan adds (no new dependency — matches the ESK_API plan's precedent).

**Spec:** `docs/superpowers/specs/2026-10-22-unlimited-catalog-hierarchy-design.md` (lives in the ESK_API repo at `/Users/enesdorukesen/WebstormProjects/ESK_API/docs/superpowers/specs/2026-10-22-unlimited-catalog-hierarchy-design.md` — read it there; its "Admin UI (ESK_ADMIN)" section is the design this plan implements in detail).

## Global Constraints

- **Hard dependency: ESK_API PR #42** (`feature/unlimited-catalog-hierarchy`, repo `dorukesen-hash/ESK_API`) must be merged and deployed to whatever backend this ESK_ADMIN instance talks to before any task in this plan can be verified end-to-end. It provides `/admin/catalog-node` (full CRUD), `nodeId` support on `GET /admin/variant/` and the Excel upload, and a `node` target on `POST /images/attach`. If it isn't live yet in your environment, implement and manually verify what's possible (component rendering, pure-logic tests) and flag what's blocked.
- **Full cutover, not a parallel addition.** Unlike the ESK_API round (additive, old and new coexisting), this plan deletes the old Category/Subcategory/Product admin components and hooks once nothing references them — there is exactly one page (`app/(dashboard)/catalog/page.js`) and one other component (`components/media/AttachImagesModal.js`) that consume them, both migrated in this same plan.
- **`/admin/category`, `/admin/subcategory`, `/admin/product` (ESK_API) are not removed by this plan.** Once this UI no longer calls them, they become dead code — retiring them server-side is a separate, smaller follow-up once this UI has run clean for a while, not bundled here.
- **Description editing simplifies to one field.** The old Subcategory/Product form modals and the page's inline description editor wrote to two different places depending on node type (a `Description` row via `description_id` for Subcategory, a plain `description` column for Product — a pre-existing inconsistency, not something this plan's job to fix). Every node going forward edits `CatalogNode.description` (plain text) directly through `updateNode`. Data already in a migrated node's `description_id` (rich subcategory descriptions with bullet points) stays there, readable only via the raw field if anyone ever needs it — this plan does not build new UI to edit it. If the user wants bullet-point editing preserved later, that is a follow-up, not a defect in this plan.
- **No test framework exists in ESK_ADMIN** (no test files, no `test` script, no test dependency). This plan adds one pure, dependency-free module (`lib/catalogNodeTree.js`) and tests it with Node's built-in `node:test` (zero new dependency), mirroring the ESK_API plan's precedent. Every other task in this plan is UI (React components, a Next.js page) with no existing testing convention to extend — those are verified manually, by running `npm run dev` and exercising the feature in a browser, per each task's own instructions.
- No existing shared UI primitive (`Modal`, `Button`, `FormField`, `DataTable`, `ConfirmDialog`, `Pagination`, `SearchInput`) is modified. This plan only consumes them exactly as the code being replaced already does.
- This work lands on ESK_ADMIN's existing `work/local-updates` branch, consistent with how admin changes have been batched so far — no new branch, no PR, local iteration until the user says it's ready.
- Per-child counts shown in the old three list sections ("N subcategories", "M products", "K variants") don't carry over as precisely — a node's "type" is no longer fixed, so a label like "subcategories" doesn't generalize. The new generic list section shows each child's direct-child count and direct-variant count instead (e.g. "3 children · 12 variants"), which is accurate at any depth without needing per-level vocabulary. This is a conscious UX simplification, not an oversight.

## Review Focus

- Editing a node and trying to move it under one of its own descendants must be blocked in the UI with a clear message, not just left to surface as a raw 400 from the server — the picker should exclude invalid targets outright rather than let the user pick one and fail. Pinned by Task 1's `collectDescendantIds` test and Task 5's manual verification.
- A node that is its own excluded subtree's ancestor must not accidentally still appear reachable through a *different* branch of the flattened picker list (i.e. excluding a subtree must truly remove every node in it, not just the one with the matching id, if two different nodes in the tree happen to share a name). Pinned by Task 1's `flattenTreeForPicker` tests (uses distinct ids, checks by id not name).
- Deleting a node with children and variants must show the real blast radius in the confirm dialog (today's copy says "also removes everything nested under it" for Category/Subcategory, "also removes its variants" for Product) — the generic version must say this regardless of the node's depth. Pinned by Task 7's manual verification script (checks the confirm dialog text against a multi-level test node).
- Navigating to `?node=<id>` for an id that no longer exists (stale link, or the node was just deleted in another tab) must fall back to the root view, not crash or show a blank page. Pinned by Task 7's manual verification.
- The Excel upload modal and the media-library `AttachImagesModal` both need the *same* node-picker behavior (exclude nothing — these never move a node, they just pick a target — but still must handle "no nodes yet" and deep trees identically). Pinned by Task 3's `CatalogNodePicker` manual verification, exercised from both call sites in Tasks 8 and 9.

---

### Task 1: Pure catalog-node tree helpers for the admin UI

**Files:**
- Create: `lib/catalogNodeTree.js`
- Create: `lib/catalogNodeTree.test.js`
- Modify: `package.json` (add a `test` script)

**Interfaces:**
- Consumes: nothing (pure functions over the nested tree shape `GET /admin/catalog-node` returns: `{id, name, parentId, ..., children: [...], variants: [...]}[]`).
- Produces:
  - `findNode(tree, nodeId): node | null` — searches the whole tree (any depth) for a node by id.
  - `findAncestors(tree, nodeId): node[]` — root-first chain of ancestors, **excluding** the target node itself; `[]` if the node is a root or not found.
  - `collectDescendantIds(tree, nodeId): number[]` — the node's id plus every descendant's id, at any depth; `[]` if the node isn't found.
  - `flattenTreeForPicker(tree, { excludeIds? }): { id, name, depth }[]` — depth-first flattening with each node's depth, skipping any node (and its whole subtree) whose id is in `excludeIds`.

- [ ] **Step 1: Add the `test` script**

In `package.json`, change:
```json
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
```
to:
```json
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "node --test"
  },
```

- [ ] **Step 2: Write the failing tests for `findNode` and `findAncestors`**

Create `lib/catalogNodeTree.test.js`:
```js
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
```

- [ ] **Step 3: Run to confirm it fails**

Run: `node --test lib/catalogNodeTree.test.js`
Expected: FAIL — `lib/catalogNodeTree.js` doesn't exist yet.

- [ ] **Step 4: Implement `findNode` and `findAncestors`**

Create `lib/catalogNodeTree.js`:
```js
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

module.exports = { findNode, findAncestors }
```

- [ ] **Step 5: Run to confirm it passes**

Run: `node --test lib/catalogNodeTree.test.js`
Expected: PASS (5 tests).

- [ ] **Step 6: Write the failing tests for `collectDescendantIds`**

Append to `lib/catalogNodeTree.test.js`:
```js
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
```

- [ ] **Step 7: Run to confirm it fails, then implement**

Run: `node --test lib/catalogNodeTree.test.js` → FAIL (not exported).

Add to `lib/catalogNodeTree.js`:
```js
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
```
Update `module.exports`:
```js
module.exports = { findNode, findAncestors, collectDescendantIds }
```

- [ ] **Step 8: Run to confirm it passes**

Run: `node --test lib/catalogNodeTree.test.js`
Expected: PASS (9 tests).

- [ ] **Step 9: Write the failing tests for `flattenTreeForPicker`**

Append:
```js
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
```

- [ ] **Step 10: Run to confirm it fails, then implement**

Run: `node --test lib/catalogNodeTree.test.js` → FAIL.

Add to `lib/catalogNodeTree.js`:
```js
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
```
Update `module.exports` to its final form:
```js
module.exports = { findNode, findAncestors, collectDescendantIds, flattenTreeForPicker }
```

- [ ] **Step 11: Run to confirm it passes**

Run: `node --test lib/catalogNodeTree.test.js`
Expected: PASS (13 tests).

- [ ] **Step 12: Commit**

```bash
git add package.json lib/catalogNodeTree.js lib/catalogNodeTree.test.js
git commit -m "Add pure catalog-node tree helpers for the admin UI"
```

---

### Task 2: `useCatalogNodes` hook + `nodeId` support on `useVariants`

**Files:**
- Create: `hooks/catalog/useCatalogNodes.js`
- Modify: `hooks/catalog/useVariants.js:8-28` (the `useVariants` query only — every other export in that file is untouched)

**Interfaces:**
- Consumes: `api` from `@/lib/api` (existing axios instance).
- Produces: `useCatalogTree(): UseQueryResult<node[]>` (`GET /admin/catalog-node`), `useCreateCatalogNode()`, `useUpdateCatalogNode()`, `useDeleteCatalogNode()` (mutations, all invalidate `["catalog-tree"]` on success). `useVariants` gains an optional `nodeId` param, passed straight through to the existing query.

- [ ] **Step 1: Create the hook file**

No automated test for this step — thin React Query wrappers with no branching logic of their own; verified manually once a page calls them (Task 7).

Create `hooks/catalog/useCatalogNodes.js`:
```js
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCatalogTree() {
	return useQuery({
		queryKey: ["catalog-tree"],
		queryFn: async () => {
			const { data } = await api.get("/admin/catalog-node");
			return data ?? [];
		},
	});
}

export function useCreateCatalogNode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/catalog-node", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-tree"] }),
	});
}

export function useUpdateCatalogNode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...payload }) => api.put(`/admin/catalog-node/${id}`, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-tree"] }),
	});
}

export function useDeleteCatalogNode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/catalog-node/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-tree"] }),
	});
}
```

- [ ] **Step 2: Add `nodeId` to `useVariants`**

In `hooks/catalog/useVariants.js`, replace:
```js
export function useVariants({ page = 0, search = "", categoryId, subcategoryId, productId, enabled = true } = {}) {
	return useQuery({
		queryKey: ["variants", page, search, categoryId, subcategoryId, productId],
		enabled,
		queryFn: async () => {
			// getVariantsForAdmin builds offset = parseInt(page) * limit using the raw
			// (possibly undefined) limit, not the parsed one - always send both explicitly
			// or the offset comes out NaN. categoryId/subcategoryId scope to variants
			// DIRECTLY attached at that level (the API excludes descendants server-side).
			const { data } = await api.get("/admin/variant/", {
				params: { page, limit: PAGE_SIZE, globalFilter: search, categoryId, subcategoryId, productId },
			});
```
with:
```js
export function useVariants({ page = 0, search = "", categoryId, subcategoryId, productId, nodeId, enabled = true } = {}) {
	return useQuery({
		queryKey: ["variants", page, search, categoryId, subcategoryId, productId, nodeId],
		enabled,
		queryFn: async () => {
			// getVariantsForAdmin builds offset = parseInt(page) * limit using the raw
			// (possibly undefined) limit, not the parsed one - always send both explicitly
			// or the offset comes out NaN. categoryId/subcategoryId/nodeId all scope to
			// variants DIRECTLY attached at that level (the API excludes descendants
			// server-side for the legacy params; nodeId has nothing to exclude - a
			// variant has exactly one nodeId).
			const { data } = await api.get("/admin/variant/", {
				params: { page, limit: PAGE_SIZE, globalFilter: search, categoryId, subcategoryId, productId, nodeId },
			});
```

(The rest of the function — dedup logic, return shape — is unchanged.)

- [ ] **Step 3: Commit**

```bash
git add hooks/catalog/useCatalogNodes.js hooks/catalog/useVariants.js
git commit -m "Add useCatalogNodes hook; nodeId support on useVariants"
```

---

### Task 3: `CatalogNodePicker` component

**Files:**
- Create: `components/catalog/CatalogNodePicker.js`

**Interfaces:**
- Consumes: `flattenTreeForPicker` from `@/lib/catalogNodeTree` (Task 1); `selectClass` from `@/components/ui/FormField`.
- Produces: `<CatalogNodePicker tree value onChange excludeIds? includeRootOption? placeholder? />` — a controlled `<select>`. `value`/`onChange` carry a string (matching every other id-select in this codebase, e.g. `SubcategoryFormModal`'s `categoryId` field) — the caller converts to/from a number.

- [ ] **Step 1: Implement the component**

No automated test — a controlled `<select>` with no logic of its own beyond what Task 1 already tests (`flattenTreeForPicker`). Verified manually once it's wired into a real form (Tasks 4, 8, 9).

Create `components/catalog/CatalogNodePicker.js`:
```js
"use client";

import { flattenTreeForPicker } from "@/lib/catalogNodeTree";
import { selectClass } from "@/components/ui/FormField";

// A flattened, indented <select> instead of a collapsible tree widget - the
// real catalog is ~50 nodes total (see the ESK_API backfill's own dry-run
// counts), which fits comfortably in one dropdown without needing to
// expand/collapse anything.
export default function CatalogNodePicker({
	tree,
	value,
	onChange,
	excludeIds = [],
	includeRootOption = false,
	placeholder = "Seçiniz",
}) {
	const options = flattenTreeForPicker(tree, { excludeIds });

	return (
		<select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
			<option value="">{placeholder}</option>
			{includeRootOption && <option value="__root__">— Üst seviye (kök) —</option>}
			{options.map((opt) => (
				<option key={opt.id} value={opt.id}>
					{"— ".repeat(opt.depth)}
					{opt.name}
				</option>
			))}
		</select>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add components/catalog/CatalogNodePicker.js
git commit -m "Add CatalogNodePicker component"
```

---

### Task 4: `CatalogNodeFormModal` component

**Files:**
- Create: `components/catalog/CatalogNodeFormModal.js`

**Interfaces:**
- Consumes: `CatalogNodePicker` (Task 3); `collectDescendantIds` from `@/lib/catalogNodeTree` (Task 1); `Modal`, `Button`, `FormField`/`inputClass`/`textareaClass`/`checkboxClass` (existing `components/ui/*`).
- Produces: `<CatalogNodeFormModal open onClose tree initialValues? defaultParentId? onSubmit isLoading />`. `onSubmit` receives `{ name, description, sku, available, parentId: number|null }` — `parentId` is `null` when the root option was chosen, otherwise a number (the caller does not need to convert anything further).

- [ ] **Step 1: Implement the component**

No automated test — a React Hook Form wrapper identical in shape to the three modals it replaces, with no logic beyond what Task 1/3 already test. Verified manually once wired into the page (Task 7).

Create `components/catalog/CatalogNodeFormModal.js`:
```js
"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, textareaClass, checkboxClass } from "@/components/ui/FormField";
import CatalogNodePicker from "./CatalogNodePicker";
import { collectDescendantIds } from "@/lib/catalogNodeTree";

const schema = yup.object({
	name: yup.string().required("İsim zorunlu"),
	description: yup.string().nullable(),
	sku: yup.string().nullable(),
	available: yup.boolean(),
	parentId: yup.string().nullable(),
});

export default function CatalogNodeFormModal({
	open,
	onClose,
	tree,
	initialValues,
	defaultParentId,
	onSubmit,
	isLoading,
}) {
	const isEdit = Boolean(initialValues);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: { name: "", description: "", sku: "", available: false, parentId: "" },
	});

	useEffect(() => {
		if (open) {
			reset({
				name: initialValues?.name ?? "",
				description: initialValues?.description ?? "",
				sku: initialValues?.sku ?? "",
				available: initialValues?.available ?? false,
				parentId:
					initialValues?.parentId != null
						? String(initialValues.parentId)
						: defaultParentId != null
						? String(defaultParentId)
						: "__root__",
			});
		}
	}, [open, initialValues, defaultParentId, reset]);

	// A node can't become its own parent, or the parent of any of its own
	// descendants - excluded from the picker outright rather than left to
	// fail server-side once chosen (see updateNode's cycle guard in ESK_API).
	const excludeIds = useMemo(
		() => (isEdit ? collectDescendantIds(tree, initialValues.id) : []),
		[isEdit, tree, initialValues]
	);

	const parentId = watch("parentId");

	const submit = (values) => {
		onSubmit({
			name: values.name,
			description: values.description || null,
			sku: values.sku || null,
			available: values.available,
			parentId: values.parentId === "__root__" || !values.parentId ? null : Number(values.parentId),
		});
	};

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "Node'u Düzenle" : "Yeni Node"}>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField label="İsim" error={errors.name}>
					<input {...register("name")} className={inputClass} autoFocus />
				</FormField>

				<FormField label="Üst Node" error={errors.parentId}>
					<CatalogNodePicker
						tree={tree}
						value={parentId}
						onChange={(value) => setValue("parentId", value)}
						excludeIds={excludeIds}
						includeRootOption
						placeholder="Seçiniz"
					/>
				</FormField>

				<FormField label="SKU" error={errors.sku}>
					<input {...register("sku")} className={inputClass} />
				</FormField>

				<FormField label="Açıklama" error={errors.description}>
					<textarea {...register("description")} rows={3} className={textareaClass} />
				</FormField>

				<label className="flex items-center gap-2 text-sm text-text-dark">
					<input type="checkbox" {...register("available")} className={checkboxClass} />
					Satışa açık
				</label>

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={isLoading}>
						Kaydet
					</Button>
				</div>
			</form>
		</Modal>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add components/catalog/CatalogNodeFormModal.js
git commit -m "Add CatalogNodeFormModal component"
```

---

### Task 5: `CatalogNodeChildrenSection` component

**Files:**
- Create: `components/catalog/CatalogNodeChildrenSection.js`

**Interfaces:**
- Consumes: `DataTable`, `Button` (existing `components/ui/*`).
- Produces: `<CatalogNodeChildrenSection nodes isLoading onSelect onAdd onEdit onDelete />` — `nodes` (deliberately not named `children`, to avoid confusion with React's own special `children` prop) is an array of node objects, each already carrying its own `.children`/`.variants` arrays from the bulk tree fetch, so counts are free.

- [ ] **Step 1: Implement the component**

No automated test — a `DataTable` wrapper with no logic of its own (counts are plain property reads). Verified manually once wired into the page (Task 7).

Create `components/catalog/CatalogNodeChildrenSection.js`:
```js
"use client";

import { useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";

// Replaces CategoriesSection/SubcategoriesSection/ProductsSection - one
// generic list of a node's direct children, at any depth. A node's "type"
// isn't fixed any more, so there's no per-level label like "subcategories"
// to show - child count and variant count instead, accurate everywhere.
export default function CatalogNodeChildrenSection({ nodes, isLoading, onSelect, onAdd, onEdit, onDelete }) {
	const rows = useMemo(
		() =>
			nodes.map((node) => ({
				...node,
				childCount: node.children?.length ?? 0,
				variantCount: node.variants?.length ?? 0,
			})),
		[nodes]
	);

	return (
		<div className="mb-6 bg-white shadow-custom">
			<div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
				<span className="text-sm font-semibold text-text-dark">
					Alt Node&apos;lar <span className="font-normal text-text-light">({rows.length})</span>
				</span>
				<Button onClick={onAdd}>
					<span className="flex items-center gap-1">
						<Plus size={16} /> Yeni Node
					</span>
				</Button>
			</div>
			<DataTable
				isLoading={isLoading}
				rows={rows}
				getRowId={(row) => row.id}
				emptyMessage="Burada henüz alt node yok."
				loadingMessage="Yükleniyor..."
				actionsLabel="İşlemler"
				onRowClick={(row) => onSelect(row)}
				columns={[
					{ key: "name", header: "İsim" },
					{ key: "childCount", header: "Alt Node", render: (row) => `${row.childCount} alt node` },
					{ key: "variantCount", header: "Varyant", render: (row) => `${row.variantCount} varyant` },
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => onEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button type="button" onClick={() => onDelete(row)} className="text-text-light hover:text-red-600">
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add components/catalog/CatalogNodeChildrenSection.js
git commit -m "Add CatalogNodeChildrenSection component"
```

---

### Task 6: Verify the ESK_API dependency is reachable

**Files:** none — this task runs commands only, to catch an unmerged/undeployed dependency before the page rewrite makes it load-bearing.

- [ ] **Step 1: Confirm `/admin/catalog-node` responds**

Run (replace `<admin-cookie>` with a real logged-in admin session cookie from the browser):
```bash
curl -s http://localhost:<api-port>/api/admin/catalog-node -H "Cookie: <admin-cookie>"
```
Expected: `200`, a JSON array (empty `[]` is fine if the backfill hasn't run yet — that's a separate, already-documented step in the ESK_API spec's deployment runbook, not this plan's job).

If this returns `404` or a connection error: **stop**. PR #42 isn't merged/deployed to the backend this ESK_ADMIN instance points at. Report this to the user rather than continuing — every later task in this plan depends on this endpoint existing.

- [ ] **Step 2: No commit** — this task makes no file changes.

---

### Task 7: Rewrite the Catalog page

**Files:**
- Modify: `app/(dashboard)/catalog/page.js` (full rewrite of its hierarchy-navigation logic; the search-mode variant listing, variant quick-edit, and Excel upload wiring are preserved, just re-pointed at `nodeId` instead of category/subcategory/productId)

**Interfaces:**
- Consumes: `useCatalogTree`, `useCreateCatalogNode`, `useUpdateCatalogNode`, `useDeleteCatalogNode` (Task 2); `findNode`, `findAncestors` (Task 1); `CatalogNodeFormModal` (Task 4); `CatalogNodeChildrenSection` (Task 5); `useVariants` with `nodeId` (Task 2, already modified).
- Produces: the page itself — no other file consumes it.

- [ ] **Step 1: Rewrite the page**

No automated test — this is the integration point of every other task in this plan; verified manually in Step 2.

Replace the full contents of `app/(dashboard)/catalog/page.js` with:
```jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { textareaClass } from "@/components/ui/FormField";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import CatalogNodeChildrenSection from "@/components/catalog/CatalogNodeChildrenSection";
import CatalogNodeFormModal from "@/components/catalog/CatalogNodeFormModal";
import VariantsSection from "@/components/catalog/VariantsSection";
import VariantQuickEditModal from "@/components/catalog/VariantQuickEditModal";
import VariantExcelUploadModal from "@/components/catalog/VariantExcelUploadModal";
import NodeImagesModal from "@/components/catalog/NodeImagesModal";
import {
	useCatalogTree,
	useCreateCatalogNode,
	useUpdateCatalogNode,
	useDeleteCatalogNode,
} from "@/hooks/catalog/useCatalogNodes";
import {
	useVariants,
	useUpdateVariant,
	useDeleteVariant,
	useUploadVariantExcel,
	PAGE_SIZE,
} from "@/hooks/catalog/useVariants";
import { findNode, findAncestors } from "@/lib/catalogNodeTree";
import { notifySuccess, notifyError } from "@/lib/toast";
import { cdnUrl } from "@/lib/cdn";

export default function CatalogPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const nodeId = searchParams.get("node") ? Number(searchParams.get("node")) : null;

	const [searchQuery, setSearchQuery] = useState("");
	const [searchPage, setSearchPage] = useState(0);
	const [variantsPage, setVariantsPage] = useState(0);

	const [nodeFormOpen, setNodeFormOpen] = useState(false);
	const [editingNode, setEditingNode] = useState(null);
	const [deletingNode, setDeletingNode] = useState(null);

	const [editingVariant, setEditingVariant] = useState(null);
	const [deletingVariant, setDeletingVariant] = useState(null);
	const [excelUploadOpen, setExcelUploadOpen] = useState(false);
	const [imagesModalOpen, setImagesModalOpen] = useState(false);

	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [descDraft, setDescDraft] = useState("");

	const { data: tree = [], isLoading: treeLoading } = useCatalogTree();

	const createNode = useCreateCatalogNode();
	const updateNode = useUpdateCatalogNode();
	const deleteNode = useDeleteCatalogNode();
	const updateVariant = useUpdateVariant();
	const deleteVariant = useDeleteVariant();
	const uploadExcel = useUploadVariantExcel();

	// Self-healing: a stale ?node=<id> (deleted elsewhere, bad link) just
	// falls back to the root view instead of crashing - findNode returns
	// null and currentNode stays null, same as never having a node param.
	const currentNode = useMemo(() => (nodeId ? findNode(tree, nodeId) : null), [tree, nodeId]);
	const ancestors = useMemo(() => (currentNode ? findAncestors(tree, currentNode.id) : []), [tree, currentNode]);

	const isSearching = searchQuery.trim().length > 0;
	const showRoot = !isSearching && !currentNode;
	const showNode = !isSearching && Boolean(currentNode);

	useEffect(() => {
		setVariantsPage(0);
		setIsEditingDesc(false);
	}, [nodeId]);

	useEffect(() => {
		setSearchPage(0);
	}, [searchQuery]);

	const goToNode = (id) => router.push(id ? `/catalog?node=${id}` : "/catalog");

	const handleSearchChange = (value) => setSearchQuery(value);

	const childrenOfCurrent = currentNode ? currentNode.children ?? [] : tree;

	const variantsFilter = currentNode ? { nodeId: currentNode.id } : null;

	const { data: hierarchyVariantsData, isLoading: hierarchyVariantsLoading } = useVariants({
		page: variantsPage,
		...variantsFilter,
		enabled: Boolean(variantsFilter),
	});
	const { data: searchData, isLoading: searchLoading } = useVariants({
		page: searchPage,
		search: searchQuery,
		enabled: isSearching,
	});

	const descText = currentNode?.description ?? "";

	const startEditDesc = () => {
		setDescDraft(descText);
		setIsEditingDesc(true);
	};

	const saveDesc = async () => {
		try {
			await updateNode.mutateAsync({ id: currentNode.id, description: descDraft });
			notifySuccess("Açıklama güncellendi.");
			setIsEditingDesc(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncelleme başarısız.");
		}
	};

	const detailImages = currentNode?.images ?? [];

	const breadcrumbItems = isSearching
		? [
				{ label: "Katalog", onClick: () => goToNode(null) },
				{ label: "Arama Sonuçları", onClick: () => setSearchQuery("") },
		  ]
		: [
				{ label: "Katalog", onClick: () => goToNode(null) },
				...ancestors.map((n) => ({ label: n.name, onClick: () => goToNode(n.id) })),
				...(currentNode ? [{ label: currentNode.name }] : []),
		  ];

	const openNodeEdit = () => {
		if (currentNode) {
			setEditingNode(currentNode);
			setNodeFormOpen(true);
		}
	};

	const openNodeDelete = () => {
		if (currentNode) setDeletingNode(currentNode);
	};

	// --- Node handlers ---
	const handleNodeSubmit = async (values) => {
		try {
			if (editingNode) {
				await updateNode.mutateAsync({ id: editingNode.id, ...values });
				notifySuccess("Node güncellendi.");
			} else {
				await createNode.mutateAsync(values);
				notifySuccess("Node oluşturuldu.");
			}
			setNodeFormOpen(false);
			setEditingNode(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleNodeDelete = async () => {
		try {
			const wasCurrent = deletingNode.id === nodeId;
			const parentId = deletingNode.parentId;
			await deleteNode.mutateAsync(deletingNode.id);
			notifySuccess("Node silindi.");
			setDeletingNode(null);
			if (wasCurrent) goToNode(parentId ?? null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	// --- Variant handlers ---
	const handleVariantUpdate = async (values) => {
		try {
			await updateVariant.mutateAsync(values);
			notifySuccess("Varyant güncellendi.");
			setEditingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncelleme başarısız.");
		}
	};

	const handleVariantDelete = async () => {
		try {
			await deleteVariant.mutateAsync(deletingVariant.id);
			notifySuccess("Varyant silindi.");
			setDeletingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	const handleExcelUpload = async (payload) => {
		try {
			await uploadExcel.mutateAsync(payload);
			notifySuccess("Excel yüklendi.");
			setExcelUploadOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Yükleme başarısız.");
		}
	};

	const visibleVariants = isSearching ? searchData : hierarchyVariantsData;
	const visibleVariantsLoading = isSearching ? searchLoading : hierarchyVariantsLoading;
	const visiblePage = isSearching ? searchPage : variantsPage;
	const setVisiblePage = isSearching ? setSearchPage : setVariantsPage;
	const visibleTotalPages = Math.max(1, Math.ceil((visibleVariants?.count ?? 0) / PAGE_SIZE));

	return (
		<div>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<CatalogBreadcrumb items={breadcrumbItems} />
					{showNode && (
						<div className="ml-2 flex items-center gap-1">
							<button type="button" onClick={openNodeEdit} className="text-text-light hover:text-custom-blue">
								<Pencil size={15} />
							</button>
							<button type="button" onClick={openNodeDelete} className="text-text-light hover:text-red-600">
								<Trash2 size={15} />
							</button>
						</div>
					)}
				</div>

				<div className="relative w-full max-w-sm">
					<Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						placeholder="Varyant adı veya SKU ile ara..."
						className="w-full border border-border-gray py-2 pl-9 pr-9 text-sm text-text-dark focus:border-custom-blue focus:outline-none"
					/>
					{isSearching && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark"
						>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			{showNode && (
				<div className="mb-6 bg-white p-5 shadow-custom">
					<div className="mb-5">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-wide text-text-light">Açıklama</span>
							{!isEditingDesc && (
								<button
									type="button"
									onClick={startEditDesc}
									className="flex items-center gap-1 text-xs font-medium text-text-light hover:text-custom-blue"
								>
									<Pencil size={13} /> Düzenle
								</button>
							)}
						</div>
						{isEditingDesc ? (
							<div>
								<textarea
									value={descDraft}
									onChange={(e) => setDescDraft(e.target.value)}
									rows={3}
									placeholder="Açıklama yazın..."
									className={textareaClass}
								/>
								<div className="mt-2 flex gap-2">
									<Button onClick={saveDesc} isLoading={updateNode.isPending}>
										Kaydet
									</Button>
									<Button variant="secondary" onClick={() => setIsEditingDesc(false)}>
										Vazgeç
									</Button>
								</div>
							</div>
						) : descText ? (
							<p className="whitespace-pre-line text-sm text-text-dark">{descText}</p>
						) : (
							<p className="text-sm italic text-text-light">Henüz açıklama yok.</p>
						)}
					</div>

					<div>
						<span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-light">Görseller</span>
						<div className="flex flex-wrap gap-3">
							{detailImages.map((img) => (
								<div key={img.id} className="relative h-20 w-20 overflow-hidden border border-border-gray bg-button-gray">
									{img.image?.url && (
										<NextImage src={cdnUrl(img.image.url)} alt="" fill sizes="80px" className="object-cover" />
									)}
								</div>
							))}
							<button
								type="button"
								onClick={() => setImagesModalOpen(true)}
								className="flex h-20 w-20 items-center justify-center border border-dashed border-border-gray text-text-light hover:border-custom-blue hover:text-custom-blue"
							>
								<Plus size={18} />
							</button>
						</div>
					</div>
				</div>
			)}

			{isSearching && (
				<VariantsSection
					variants={visibleVariants?.rows ?? []}
					count={visibleVariants?.count ?? 0}
					page={visiblePage}
					totalPages={visibleTotalPages}
					isLoading={visibleVariantsLoading}
					onPageChange={setVisiblePage}
					onEdit={setEditingVariant}
					onDelete={setDeletingVariant}
				/>
			)}

			{!isSearching && (
				<>
					<CatalogNodeChildrenSection
						nodes={childrenOfCurrent}
						isLoading={treeLoading}
						onSelect={(row) => goToNode(row.id)}
						onAdd={() => {
							setEditingNode(null);
							setNodeFormOpen(true);
						}}
						onEdit={(row) => {
							setEditingNode(row);
							setNodeFormOpen(true);
						}}
						onDelete={setDeletingNode}
					/>

					{showNode && (
						<VariantsSection
							variants={hierarchyVariantsData?.rows ?? []}
							count={hierarchyVariantsData?.count ?? 0}
							page={variantsPage}
							totalPages={visibleTotalPages}
							isLoading={hierarchyVariantsLoading}
							onPageChange={setVariantsPage}
							onEdit={setEditingVariant}
							onDelete={setDeletingVariant}
							onUploadExcel={() => setExcelUploadOpen(true)}
						/>
					)}
				</>
			)}

			<CatalogNodeFormModal
				open={nodeFormOpen}
				onClose={() => setNodeFormOpen(false)}
				tree={tree}
				initialValues={editingNode}
				defaultParentId={currentNode?.id}
				onSubmit={handleNodeSubmit}
				isLoading={createNode.isPending || updateNode.isPending}
			/>

			<VariantQuickEditModal
				open={Boolean(editingVariant)}
				onClose={() => setEditingVariant(null)}
				variant={editingVariant}
				onSubmit={handleVariantUpdate}
				isLoading={updateVariant.isPending}
			/>

			<VariantExcelUploadModal
				open={excelUploadOpen}
				onClose={() => setExcelUploadOpen(false)}
				tree={tree}
				initialNode={currentNode ? { id: currentNode.id, label: currentNode.name } : null}
				onSubmit={handleExcelUpload}
				isLoading={uploadExcel.isPending}
			/>

			<NodeImagesModal
				open={imagesModalOpen}
				onClose={() => setImagesModalOpen(false)}
				target="node"
				targetId={currentNode?.id}
				currentImages={detailImages}
			/>

			<ConfirmDialog
				open={Boolean(deletingNode)}
				onClose={() => setDeletingNode(null)}
				onConfirm={handleNodeDelete}
				title="Node'u sil"
				description={`"${deletingNode?.name}" silinsin mi? Bu, altındaki her şeyi (alt node'lar ve varyantlar) da kaldırır.`}
				isLoading={deleteNode.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingVariant)}
				onClose={() => setDeletingVariant(null)}
				onConfirm={handleVariantDelete}
				title="Varyantı sil"
				description={`"${deletingVariant?.title}" silinsin mi?`}
				isLoading={deleteVariant.isPending}
			/>
		</div>
	);
}
```

Note: `VariantExcelUploadModal` now takes `tree`/`initialNode` instead of `categories`/`subcategories`/`products`/`initialHierarchy` — that is Task 8's own change; this page passes the new prop names already, so Task 8 must land before this page is fully functional (both tasks' code is written here and wired together, verified together in Step 2).

- [ ] **Step 2: Verify manually against the real app**

Depends on Task 6 passing (the ESK_API dependency being reachable) and Tasks 1-5, 8 being implemented (the page references `VariantExcelUploadModal`'s new prop shape from Task 8).

Run: `npm run dev` (port 3002, per `package.json`), open `http://localhost:3002/catalog` in a browser, with ESK_API's dev server also running and the backfill having been run against that environment (per the ESK_API spec's deployment runbook) so there's real data to browse.

Check, in order:
1. Root view shows every top-level category as a row in "Alt Node'lar", with child/variant counts.
2. Clicking a row navigates to `?node=<id>` and shows that node's own children and (if any) its direct variants.
3. Drilling into a 3+ level deep node (category → subcategory → product, or deeper if the backfill produced anything beyond 3 levels) still works — breadcrumb shows every ancestor, "New Node" still works at that depth.
4. Pasting a URL with `?node=999999999` (a nonexistent id) falls back to the root view instead of crashing.
5. Create a new node under some existing node; edit its name/description/sku; delete it (with children) and confirm the children are gone too via `GET /admin/catalog-node` directly.
6. Attach an image via the "Görseller" `+` button; confirm it shows up after the modal closes.
7. Description edit/save round-trips correctly.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/catalog/page.js"
git commit -m "Rewrite Catalog page for arbitrary-depth node browsing"
```

---

### Task 8: Update `VariantExcelUploadModal` for node targets

**Files:**
- Modify: `components/catalog/VariantExcelUploadModal.js` (full rewrite — the hierarchy-type-then-id two-step picker becomes one node picker)

**Interfaces:**
- Consumes: `CatalogNodePicker` (Task 3).
- Produces: same external contract as before (`open`, `onClose`, `onSubmit({file, hierarchyType, hierarchyId})`, `isLoading`), except the prop that supplies pickable options changes from `categories`/`subcategories`/`products` to a single `tree` prop, and `initialHierarchy: {type, id, label}` becomes `initialNode: {id, label}`. `onSubmit` always sends `hierarchyType: "node"` now.

- [ ] **Step 1: Rewrite the component**

No automated test — a controlled form with no logic beyond `CatalogNodePicker`'s own (tested in Task 1). Verified manually in Task 7 Step 2 (the Catalog page already wires this) and standalone by opening the modal directly.

Replace the full contents of `components/catalog/VariantExcelUploadModal.js` with:
```jsx
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import CatalogNodePicker from "./CatalogNodePicker";

// initialNode: { id, label } - when set (opened from within a node's own
// page), the target is pre-filled and locked instead of requiring the
// manual picker below.
export default function VariantExcelUploadModal({ open, onClose, tree, initialNode, onSubmit, isLoading }) {
	const [nodeId, setNodeId] = useState("");
	const [file, setFile] = useState(null);

	const locked = Boolean(initialNode);

	useEffect(() => {
		if (!open) return;
		setNodeId(initialNode ? String(initialNode.id) : "");
		setFile(null);
	}, [open, initialNode]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!file || !nodeId) return;
		onSubmit({ file, hierarchyType: "node", hierarchyId: nodeId });
	};

	return (
		<Modal open={open} onClose={onClose} title="Excel ile Varyant Yükle">
			<form onSubmit={handleSubmit} className="space-y-4">
				{locked ? (
					<FormField label="Hedef">
						<div className="border border-border-gray bg-button-gray px-3 py-2 text-sm text-text-dark">
							{initialNode.label}
						</div>
					</FormField>
				) : (
					<FormField label="Hedef Node">
						<CatalogNodePicker tree={tree} value={nodeId} onChange={setNodeId} />
					</FormField>
				)}

				<FormField label="Excel Dosyası (.xlsx)">
					<input
						type="file"
						accept=".xlsx,.xls"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="w-full text-sm text-text-dark"
					/>
				</FormField>

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={isLoading} disabled={!file || !nodeId}>
						Yükle
					</Button>
				</div>
			</form>
		</Modal>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add components/catalog/VariantExcelUploadModal.js
git commit -m "VariantExcelUploadModal: single node picker instead of hierarchy-type-then-id"
```

---

### Task 9: Update `AttachImagesModal` (media library) for node targets

**Files:**
- Modify: `components/media/AttachImagesModal.js` (full rewrite)

**Interfaces:**
- Consumes: `useCatalogTree` (Task 2); `CatalogNodePicker` (Task 3).
- Produces: same external contract (`open`, `onClose`, `imageIds`, `onDone`); the target type options narrow from `{product, subcategory, variant}` to `{node, variant}`.

- [ ] **Step 1: Rewrite the component**

No automated test — a controlled form with no logic of its own. Verified manually in Step 2.

Replace the full contents of `components/media/AttachImagesModal.js` with:
```jsx
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { selectClass } from "@/components/ui/FormField";
import VariantPicker from "@/components/catalog/VariantPicker";
import CatalogNodePicker from "@/components/catalog/CatalogNodePicker";
import { useCatalogTree } from "@/hooks/catalog/useCatalogNodes";
import { useAttachImages } from "@/hooks/media/useImages";
import { notifySuccess, notifyError } from "@/lib/toast";

const TARGET_LABELS = {
	node: "Katalog Node",
	variant: "Varyant",
};

export default function AttachImagesModal({ open, onClose, imageIds, onDone }) {
	const [target, setTarget] = useState("node");
	const [targetId, setTargetId] = useState("");
	const [selectedVariant, setSelectedVariant] = useState(null);

	const { data: tree = [] } = useCatalogTree();
	const attachImages = useAttachImages();

	const resolvedTargetId = target === "variant" ? selectedVariant?.id : targetId;

	const changeTarget = (value) => {
		setTarget(value);
		setTargetId("");
		setSelectedVariant(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!resolvedTargetId) return;
		try {
			await attachImages.mutateAsync({ ids: imageIds, target, targetId: resolvedTargetId });
			notifySuccess("Görseller atandı.");
			onDone();
		} catch (error) {
			notifyError(error?.response?.data?.message || "Atama başarısız.");
		}
	};

	return (
		<Modal open={open} onClose={onClose} title="Görselleri Ata">
			<form onSubmit={handleSubmit} className="space-y-4">
				<p className="text-sm text-text-light">
					{imageIds.length} görsel seçili. Bu işlem, hedefin mevcut görsellerinin yerini alır.
				</p>

				<FormField label="Hedef Tipi">
					<select value={target} onChange={(e) => changeTarget(e.target.value)} className={selectClass}>
						{Object.entries(TARGET_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</FormField>

				{target === "variant" ? (
					<FormField label="Varyant">
						{selectedVariant ? (
							<div className="flex items-center justify-between border border-border-gray px-3 py-2 text-sm text-text-dark">
								<span>
									{selectedVariant.title} <span className="text-text-light">({selectedVariant.sku})</span>
								</span>
								<button
									type="button"
									onClick={() => setSelectedVariant(null)}
									className="text-text-light hover:text-red-600"
								>
									Değiştir
								</button>
							</div>
						) : (
							<VariantPicker onSelect={setSelectedVariant} />
						)}
					</FormField>
				) : (
					<FormField label="Katalog Node">
						<CatalogNodePicker tree={tree} value={targetId} onChange={setTargetId} />
					</FormField>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={attachImages.isPending} disabled={!resolvedTargetId}>
						Ata
					</Button>
				</div>
			</form>
		</Modal>
	);
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, open the Media Library page, select an image, open "Görselleri Ata", pick "Katalog Node", pick a node from the dropdown, submit. Confirm the image shows up under that node's images in `/catalog?node=<id>`.

- [ ] **Step 3: Commit**

```bash
git add components/media/AttachImagesModal.js
git commit -m "AttachImagesModal: node target instead of separate subcategory/product targets"
```

---

### Task 10: Remove the old Category/Subcategory/Product admin files

**Files:**
- Delete: `components/catalog/CategoryFormModal.js`, `components/catalog/SubcategoryFormModal.js`, `components/catalog/ProductFormModal.js`, `components/catalog/CategoriesSection.js`, `components/catalog/SubcategoriesSection.js`, `components/catalog/ProductsSection.js`
- Delete: `hooks/catalog/useCategories.js`, `hooks/catalog/useSubcategories.js`, `hooks/catalog/useProducts.js`

**Interfaces:** none — this task only removes files nothing imports any more (confirmed by Step 1).

- [ ] **Step 1: Confirm nothing still imports them**

Run:
```bash
grep -rln "useCategories\|useSubcategories\|useProducts\b\|CategoryFormModal\|SubcategoryFormModal\|ProductFormModal\|CategoriesSection\|SubcategoriesSection\|ProductsSection" --include="*.js" --include="*.jsx" app components hooks
```
Expected: only the files being deleted in this task appear in the output (each one matches its own name/export) — no other file. If any other file shows up, **stop** — something besides `catalog/page.js` and `AttachImagesModal.js` depends on the old system and this plan missed it; do not delete until that's resolved.

- [ ] **Step 2: Delete the files**

```bash
git rm components/catalog/CategoryFormModal.js components/catalog/SubcategoryFormModal.js components/catalog/ProductFormModal.js components/catalog/CategoriesSection.js components/catalog/SubcategoriesSection.js components/catalog/ProductsSection.js
git rm hooks/catalog/useCategories.js hooks/catalog/useSubcategories.js hooks/catalog/useProducts.js
```

- [ ] **Step 3: Verify the app still builds and runs**

Run: `npm run build`
Expected: builds cleanly, no "module not found" errors from the removed files.

Run: `npm run dev`, reload `http://localhost:3002/catalog` in a browser, confirm it still works exactly as verified in Task 7 Step 2.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove the old Category/Subcategory/Product admin components and hooks"
```
