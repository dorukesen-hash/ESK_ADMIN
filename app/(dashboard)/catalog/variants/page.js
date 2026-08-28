"use client";

import { useState } from "react";
import { Upload, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import VariantQuickEditModal from "@/components/catalog/VariantQuickEditModal";
import VariantExcelUploadModal from "@/components/catalog/VariantExcelUploadModal";
import { useCategories } from "@/hooks/catalog/useCategories";
import { useSubcategories } from "@/hooks/catalog/useSubcategories";
import { useProducts } from "@/hooks/catalog/useProducts";
import {
	useVariants,
	useUpdateVariant,
	useDeleteVariant,
	useUploadVariantExcel,
	PAGE_SIZE,
} from "@/hooks/catalog/useVariants";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function VariantsPage() {
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [editingVariant, setEditingVariant] = useState(null);
	const [deletingVariant, setDeletingVariant] = useState(null);
	const [uploadOpen, setUploadOpen] = useState(false);

	const { data: categories = [] } = useCategories();
	const { data: subcategories = [] } = useSubcategories();
	const { data: products = [] } = useProducts();
	const { data, isLoading } = useVariants({ page, search });
	const variants = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	const updateVariant = useUpdateVariant();
	const deleteVariant = useDeleteVariant();
	const uploadExcel = useUploadVariantExcel();

	const handleSearch = (value) => {
		setSearch(value);
		setPage(0);
	};

	const handleUpdate = async (values) => {
		try {
			await updateVariant.mutateAsync(values);
			notifySuccess("Varyant güncellendi.");
			setEditingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncelleme başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteVariant.mutateAsync(deletingVariant.id);
			notifySuccess("Varyant silindi.");
			setDeletingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	const handleUpload = async (payload) => {
		try {
			await uploadExcel.mutateAsync(payload);
			notifySuccess("Excel yüklendi.");
			setUploadOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Yükleme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Varyantlar"
				action={
					<Button onClick={() => setUploadOpen(true)}>
						<span className="flex items-center gap-1">
							<Upload size={16} /> Excel Yükle
						</span>
					</Button>
				}
			/>

			<div className="mb-4">
				<SearchInput value={search} onChange={handleSearch} placeholder="Varyant ara..." />
			</div>

			<DataTable
				isLoading={isLoading}
				rows={variants}
				getRowId={(row) => row.id}
				emptyMessage="Varyant bulunamadı"
				columns={[
					{ key: "title", header: "Başlık" },
					{ key: "stock", header: "Stok #" },
					{
						key: "parent",
						header: "Bağlı Olduğu",
						render: (row) => row.product?.title ?? row.subcategory?.name ?? row.category?.name ?? "-",
					},
					{ key: "one_four_units", header: "1-4 Adet", render: (row) => row.one_four_units ?? "-" },
					{ key: "available", header: "Durum", render: (row) => (row.available ? "Satışta" : "Pasif") },
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => setEditingVariant(row)}
							className="text-text-light hover:text-custom-blue"
						>
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingVariant(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />

			<VariantQuickEditModal
				open={Boolean(editingVariant)}
				onClose={() => setEditingVariant(null)}
				variant={editingVariant}
				onSubmit={handleUpdate}
				isLoading={updateVariant.isPending}
			/>

			<VariantExcelUploadModal
				open={uploadOpen}
				onClose={() => setUploadOpen(false)}
				categories={categories}
				subcategories={subcategories}
				products={products}
				onSubmit={handleUpload}
				isLoading={uploadExcel.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingVariant)}
				onClose={() => setDeletingVariant(null)}
				onConfirm={handleDelete}
				title="Varyantı sil"
				description={`"${deletingVariant?.title}" varyantını silmek istediğinize emin misiniz?`}
				isLoading={deleteVariant.isPending}
			/>
		</div>
	);
}
