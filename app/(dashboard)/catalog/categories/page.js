"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CategoryFormModal from "@/components/catalog/CategoryFormModal";
import {
	useCategories,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
} from "@/hooks/catalog/useCategories";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function CategoriesPage() {
	const [search, setSearch] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState(null);
	const [deletingCategory, setDeletingCategory] = useState(null);

	const { data: categories = [], isLoading } = useCategories();
	const createCategory = useCreateCategory();
	const updateCategory = useUpdateCategory();
	const deleteCategory = useDeleteCategory();

	const filtered = useMemo(() => {
		if (!search) return categories;
		return categories.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));
	}, [categories, search]);

	const openCreate = () => {
		setEditingCategory(null);
		setFormOpen(true);
	};

	const openEdit = (category) => {
		setEditingCategory(category);
		setFormOpen(true);
	};

	const handleSubmit = async (values) => {
		try {
			if (editingCategory) {
				await updateCategory.mutateAsync({ id: editingCategory.id, name: values.name });
				notifySuccess("Kategori güncellendi.");
			} else {
				await createCategory.mutateAsync(values);
				notifySuccess("Kategori eklendi.");
			}
			setFormOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteCategory.mutateAsync(deletingCategory.id);
			notifySuccess("Kategori silindi.");
			setDeletingCategory(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Kategoriler"
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni Kategori
						</span>
					</Button>
				}
			/>

			<div className="mb-4">
				<SearchInput value={search} onChange={setSearch} placeholder="Kategori ara..." />
			</div>

			<DataTable
				isLoading={isLoading}
				rows={filtered}
				getRowId={(row) => row.id}
				emptyMessage="Kategori bulunamadı"
				columns={[{ key: "name", header: "İsim" }]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => openEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingCategory(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<CategoryFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				initialValues={editingCategory}
				onSubmit={handleSubmit}
				isLoading={createCategory.isPending || updateCategory.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingCategory)}
				onClose={() => setDeletingCategory(null)}
				onConfirm={handleDelete}
				title="Kategoriyi sil"
				description={`"${deletingCategory?.name}" kategorisini silmek istediğinize emin misiniz?`}
				isLoading={deleteCategory.isPending}
			/>
		</div>
	);
}
