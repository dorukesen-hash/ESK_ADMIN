"use client";

import { useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";

// `products` here is the already-scoped list (either a category's direct
// products or a subcategory's products) computed by the page. getProductsforAdmin
// nests each product's own `variants`, so the count is free and exact.
export default function ProductsSection({ products, isLoading, onSelect, onAdd, onEdit, onDelete }) {
	const rows = useMemo(
		() => products.map((product) => ({ ...product, variantCount: product.variants?.length ?? 0 })),
		[products]
	);

	return (
		<div className="mb-6 bg-white shadow-custom">
			<div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
				<span className="text-sm font-semibold text-text-dark">
					Products <span className="font-normal text-text-light">({rows.length})</span>
				</span>
				<Button onClick={onAdd}>
					<span className="flex items-center gap-1">
						<Plus size={16} /> Add Product
					</span>
				</Button>
			</div>
			<DataTable
				isLoading={isLoading}
				rows={rows}
				getRowId={(row) => row.id}
				emptyMessage="No products are directly attached here."
				loadingMessage="Loading..."
				actionsLabel="Actions"
				onRowClick={(row) => onSelect(row)}
				columns={[
					{ key: "title", header: "Product Name" },
					{ key: "variantCount", header: "Variants", render: (row) => `${row.variantCount} variants` },
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
