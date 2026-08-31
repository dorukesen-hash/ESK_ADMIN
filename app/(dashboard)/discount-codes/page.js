"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DiscountCodeFormModal from "@/components/discountCodes/DiscountCodeFormModal";
import {
	useDiscountCodes,
	useCreateDiscountCode,
	useUpdateDiscountCode,
	useDeleteDiscountCode,
} from "@/hooks/discountCodes/useDiscountCodes";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function DiscountCodesPage() {
	const [formOpen, setFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [deletingItem, setDeletingItem] = useState(null);

	const { data: codes = [], isLoading } = useDiscountCodes();
	const createItem = useCreateDiscountCode();
	const updateItem = useUpdateDiscountCode();
	const deleteItem = useDeleteDiscountCode();

	const openCreate = () => {
		setEditingItem(null);
		setFormOpen(true);
	};

	const openEdit = (item) => {
		setEditingItem(item);
		setFormOpen(true);
	};

	const handleSubmit = async (values) => {
		try {
			if (editingItem) {
				await updateItem.mutateAsync({ id: editingItem.id, ...values });
				notifySuccess("Güncellendi.");
			} else {
				await createItem.mutateAsync(values);
				notifySuccess("Eklendi.");
			}
			setFormOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteItem.mutateAsync(deletingItem.id);
			notifySuccess("Silindi.");
			setDeletingItem(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="İndirim Kodları"
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni İndirim Kodu
						</span>
					</Button>
				}
			/>

			<DataTable
				isLoading={isLoading}
				rows={codes}
				getRowId={(row) => row.id}
				emptyMessage="İndirim kodu bulunamadı"
				columns={[
					{ key: "code", header: "Kod" },
					{
						key: "value",
						header: "İndirim",
						render: (row) => (row.type === "fixed" ? `$${row.value}` : `%${row.value}`),
					},
					{
						key: "usage",
						header: "Kullanım",
						render: (row) => `${row.timesUsed}${row.maxUses != null ? ` / ${row.maxUses}` : ""}`,
					},
					{
						key: "firstOrderOnly",
						header: "Otomatik (İlk Sipariş)",
						render: (row) => (row.firstOrderOnly ? "Evet" : "-"),
					},
					{
						key: "isActive",
						header: "Durum",
						render: (row) => (
							<span className={row.isActive ? "text-custom-button-green" : "text-text-light"}>
								{row.isActive ? "Aktif" : "Pasif"}
							</span>
						),
					},
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => openEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingItem(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<DiscountCodeFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				initialValues={editingItem}
				onSubmit={handleSubmit}
				isLoading={createItem.isPending || updateItem.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingItem)}
				onClose={() => setDeletingItem(null)}
				onConfirm={handleDelete}
				title="İndirim kodunu sil"
				description="Bu indirim kodunu silmek istediğinize emin misiniz?"
				isLoading={deleteItem.isPending}
			/>
		</div>
	);
}
