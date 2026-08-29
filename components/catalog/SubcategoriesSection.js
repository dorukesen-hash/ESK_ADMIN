"use client";

import { useMemo } from "react";
import NextImage from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

// getSubCategoriesforAdmin already nests each subcategory's own `variants`
// and `products` arrays, so the product count here is precise (direct-only,
// since a subcategory's own row is the scope) and the variant count is free -
// though it includes variants that also sit under one of this subcategory's
// products (not filtered to "direct" the way the drilled-in Variants section
// is), so it reads as a branch total rather than an exact direct count.
export default function SubcategoriesSection({ subcategories, isLoading, onSelect, onAdd, onEdit, onDelete }) {
	const rows = useMemo(
		() =>
			subcategories.map((sub) => {
				// subcategory_images (the real gallery) wins over the legacy single
				// `imgurl` column - fall back to imgurl only when no gallery image exists.
				// imgurl's exact format isn't confirmed (may already be absolute), so only
				// prefix the CDN host onto a relative path.
				const rawUrl = sub.subcategory_images?.[0]?.image?.url ?? sub.imgurl ?? null;
				const thumbUrl = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `${CDN_URL}/${rawUrl}`) : null;
				return {
					...sub,
					productCount: sub.products?.length ?? 0,
					variantCount: sub.variants?.length ?? 0,
					thumbUrl,
				};
			}),
		[subcategories]
	);

	return (
		<div className="mb-6 bg-white shadow-custom">
			<div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
				<span className="text-sm font-semibold text-text-dark">
					Subcategories <span className="font-normal text-text-light">({rows.length})</span>
				</span>
				<Button onClick={onAdd}>
					<span className="flex items-center gap-1">
						<Plus size={16} /> Add Subcategory
					</span>
				</Button>
			</div>
			<DataTable
				isLoading={isLoading}
				rows={rows}
				getRowId={(row) => row.id}
				emptyMessage="This category has no subcategories yet."
				loadingMessage="Loading..."
				actionsLabel="Actions"
				onRowClick={(row) => onSelect(row)}
				columns={[
					{
						key: "thumb",
						header: "Image",
						render: (row) =>
							row.thumbUrl ? (
								<div className="relative h-10 w-10 overflow-hidden border border-border-gray bg-button-gray">
									<NextImage src={row.thumbUrl} alt="" fill sizes="40px" className="object-cover" />
								</div>
							) : (
								<div className="h-10 w-10 border border-dashed border-border-gray" />
							),
					},
					{ key: "name", header: "Subcategory Name" },
					{ key: "productCount", header: "Products", render: (row) => `${row.productCount} products` },
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
