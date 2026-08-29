"use client";

import { useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";

// Category rows carry no nested data at all (getCategoriesforAdmin has zero
// includes) - subcategory/product counts are derived client-side from the
// already-fetched wholesale lists. A precise variant count isn't cheaply
// available at this level (variants aren't fetched wholesale), so it's left
// off here; the real Variants section shows exact counts once you drill in.
export default function CategoriesSection({ categories, subcategories, products, isLoading, onSelect, onAdd, onEdit, onDelete }) {
	const rows = useMemo(() => {
		return categories.map((category) => ({
			...category,
			subcategoryCount: subcategories.filter((s) => s.categoryId === category.id).length,
			productCount: products.filter((p) => p.categoryId === category.id && !p.subcategoryId).length,
		}));
	}, [categories, subcategories, products]);

	return (
		<div className="mb-6 bg-white shadow-custom">
			<div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
				<span className="text-sm font-semibold text-text-dark">
					Categories <span className="font-normal text-text-light">({rows.length})</span>
				</span>
				<Button onClick={onAdd}>
					<span className="flex items-center gap-1">
						<Plus size={16} /> New Category
					</span>
				</Button>
			</div>
			<DataTable
				isLoading={isLoading}
				rows={rows}
				getRowId={(row) => row.id}
				emptyMessage="No categories yet"
				loadingMessage="Loading..."
				actionsLabel="Actions"
				onRowClick={(row) => onSelect(row)}
				columns={[
					{ key: "name", header: "Category Name" },
					{ key: "subcategoryCount", header: "Subcategories", render: (row) => `${row.subcategoryCount} subcategories` },
					{ key: "productCount", header: "Products", render: (row) => `${row.productCount} products` },
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
