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
