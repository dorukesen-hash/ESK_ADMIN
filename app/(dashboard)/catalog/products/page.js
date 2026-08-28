"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProductFormModal from "@/components/catalog/ProductFormModal";
import { useCategories } from "@/hooks/catalog/useCategories";
import { useSubcategories } from "@/hooks/catalog/useSubcategories";
import {
	useProducts,
	useCreateProduct,
	useUpdateProduct,
	useDeleteProduct,
} from "@/hooks/catalog/useProducts";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function ProductsPage() {
	const [search, setSearch] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [deletingProduct, setDeletingProduct] = useState(null);

	const { data: categories = [] } = useCategories();
	const { data: subcategories = [] } = useSubcategories();
	const { data: products = [], isLoading } = useProducts(search);
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const deleteProduct = useDeleteProduct();

	const openCreate = () => {
		setEditingProduct(null);
		setFormOpen(true);
	};

	const openEdit = (product) => {
		setEditingProduct(product);
		setFormOpen(true);
	};

	const handleSubmit = async (values) => {
		try {
			if (editingProduct) {
				await updateProduct.mutateAsync({ id: editingProduct.id, ...values, variants: [] });
				notifySuccess("Ürün güncellendi.");
			} else {
				await createProduct.mutateAsync(values);
				notifySuccess("Ürün eklendi.");
			}
			setFormOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteProduct.mutateAsync(deletingProduct.id);
			notifySuccess("Ürün silindi.");
			setDeletingProduct(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Ürünler"
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni Ürün
						</span>
					</Button>
				}
			/>

			<div className="mb-4">
				<SearchInput value={search} onChange={setSearch} placeholder="Ürün ara..." />
			</div>

			<DataTable
				isLoading={isLoading}
				rows={products}
				getRowId={(row) => row.id}
				emptyMessage="Ürün bulunamadı"
				columns={[
					{ key: "title", header: "Başlık" },
					{ key: "category", header: "Kategori", render: (row) => row.category?.name ?? "-" },
					{ key: "subcategory", header: "Alt Kategori", render: (row) => row.subcategory?.name ?? "-" },
					{ key: "available", header: "Durum", render: (row) => (row.available ? "Satışta" : "Pasif") },
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => openEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingProduct(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<ProductFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				categories={categories}
				subcategories={subcategories}
				initialValues={editingProduct}
				onSubmit={handleSubmit}
				isLoading={createProduct.isPending || updateProduct.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingProduct)}
				onClose={() => setDeletingProduct(null)}
				onConfirm={handleDelete}
				title="Ürünü sil"
				description={`"${deletingProduct?.title}" ürününü silmek istediğinize emin misiniz?`}
				isLoading={deleteProduct.isPending}
			/>
		</div>
	);
}
