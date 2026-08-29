"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SubcategoryFormModal from "@/components/catalog/SubcategoryFormModal";
import { useCategories } from "@/hooks/catalog/useCategories";
import {
	useSubcategories,
	useCreateSubcategory,
	useUpdateSubcategory,
	useDeleteSubcategory,
} from "@/hooks/catalog/useSubcategories";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function SubcategoriesPage() {
	const [search, setSearch] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingSubcategory, setEditingSubcategory] = useState(null);
	const [deletingSubcategory, setDeletingSubcategory] = useState(null);

	const { data: categories = [] } = useCategories();
	const { data: subcategories = [], isLoading } = useSubcategories(search);
	const createSubcategory = useCreateSubcategory();
	const updateSubcategory = useUpdateSubcategory();
	const deleteSubcategory = useDeleteSubcategory();

	const openCreate = () => {
		setEditingSubcategory(null);
		setFormOpen(true);
	};

	const openEdit = (subcategory) => {
		setEditingSubcategory(subcategory);
		setFormOpen(true);
	};

	const handleSubmit = async (values) => {
		try {
			if (editingSubcategory) {
				await updateSubcategory.mutateAsync({
					id: editingSubcategory.id,
					name: values.name,
					available: values.available,
					description_id: values.description_id,
					description: values.description,
					desc2: { list_items: values.list_items },
					// Deliberately omitting `variants` - the API treats it as optional and
					// leaves attached variants untouched; sending [] would delete them all.
				});
				notifySuccess("Alt kategori güncellendi.");
			} else {
				await createSubcategory.mutateAsync({
					name: values.name,
					categoryId: values.categoryId,
					description: values.description,
					list_items: values.list_items,
					available: values.available,
				});
				notifySuccess("Alt kategori eklendi.");
			}
			setFormOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteSubcategory.mutateAsync(deletingSubcategory.id);
			notifySuccess("Alt kategori silindi.");
			setDeletingSubcategory(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Alt Kategoriler"
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni Alt Kategori
						</span>
					</Button>
				}
			/>

			<div className="mb-4">
				<SearchInput value={search} onChange={setSearch} placeholder="Alt kategori ara..." />
			</div>

			<DataTable
				isLoading={isLoading}
				rows={subcategories}
				getRowId={(row) => row.id}
				emptyMessage="Alt kategori bulunamadı"
				columns={[
					{ key: "name", header: "İsim" },
					{ key: "category", header: "Kategori", render: (row) => row.category?.name ?? "-" },
					{ key: "available", header: "Durum", render: (row) => (row.available ? "Satışta" : "Pasif") },
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => openEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingSubcategory(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<SubcategoryFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				categories={categories}
				initialValues={editingSubcategory}
				onSubmit={handleSubmit}
				isLoading={createSubcategory.isPending || updateSubcategory.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingSubcategory)}
				onClose={() => setDeletingSubcategory(null)}
				onConfirm={handleDelete}
				title="Alt kategoriyi sil"
				description={`"${deletingSubcategory?.name}" alt kategorisini silmek istediğinize emin misiniz?`}
				isLoading={deleteSubcategory.isPending}
			/>
		</div>
	);
}
