"use client";

import { Upload, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";

// Leaf level - row click opens VariantQuickEditModal (via onEdit) rather than
// navigating deeper. Backed by the real paginated /admin/variant/ endpoint at
// every level (category/subcategory/product), scoped server-side to DIRECT
// variants only - see the categoryId/subcategoryId/productId filter added to
// getVariantsForAdmin. There's no single-variant "create" endpoint in the API
// (addVariantForAdmin is an unimplemented stub) - Excel upload is the only
// real way to add variants, so that's the only header action; onUploadExcel
// is omitted entirely in search mode, where there's no single target node.
export default function VariantsSection({
	variants,
	count,
	page,
	totalPages,
	isLoading,
	onPageChange,
	onEdit,
	onDelete,
	onUploadExcel,
}) {
	return (
		<div className="mb-6 bg-white shadow-custom">
			<div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
				<span className="text-sm font-semibold text-text-dark">
					Variants <span className="font-normal text-text-light">({count})</span>
				</span>
				{onUploadExcel && (
					<Button variant="secondary" onClick={onUploadExcel}>
						<span className="flex items-center gap-1">
							<Upload size={16} /> Upload Excel
						</span>
					</Button>
				)}
			</div>
			<DataTable
				isLoading={isLoading}
				rows={variants}
				getRowId={(row) => row.id}
				emptyMessage="No variants are directly attached here."
				loadingMessage="Loading..."
				actionsLabel="Actions"
				onRowClick={(row) => onEdit(row)}
				columns={[
					{ key: "title", header: "Variant Name" },
					{ key: "stock", header: "SKU" },
					{ key: "one_four_units", header: "Price", render: (row) => row.one_four_units ?? "-" },
				]}
				actions={(row) => (
					<div className="flex justify-end">
						<button type="button" onClick={() => onDelete(row)} className="text-text-light hover:text-red-600">
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>
			<div className="bg-white px-5 pb-4">
				<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => onPageChange(p - 1)} />
			</div>
		</div>
	);
}
