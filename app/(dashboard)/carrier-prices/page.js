"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CarrierPriceFormModal from "@/components/fulfillment/CarrierPriceFormModal";
import { useCarriers } from "@/hooks/fulfillment/useCarriers";
import { useDeciList } from "@/hooks/fulfillment/useDeci";
import {
	useCarrierPrices,
	useCreateCarrierPrice,
	useUpdateCarrierPrice,
	useDeleteCarrierPrice,
} from "@/hooks/fulfillment/useCarrierPrices";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function CarrierPricesPage() {
	const [formOpen, setFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [deletingItem, setDeletingItem] = useState(null);

	const { data: carriers = [] } = useCarriers();
	const { data: deciList = [] } = useDeciList();
	const { data: prices = [], isLoading } = useCarrierPrices();
	const createItem = useCreateCarrierPrice();
	const updateItem = useUpdateCarrierPrice();
	const deleteItem = useDeleteCarrierPrice();

	const carrierName = (id) => carriers.find((c) => c.id === id)?.name ?? "-";
	const deciRange = (id) => {
		const d = deciList.find((d) => d.id === id);
		return d ? `${d.min} - ${d.max}` : "-";
	};

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
				title="Kargo Fiyatları"
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni Kargo Fiyatı
						</span>
					</Button>
				}
			/>

			<DataTable
				isLoading={isLoading}
				rows={prices}
				getRowId={(row) => row.id}
				emptyMessage="Kayıt bulunamadı"
				columns={[
					{ key: "price", header: "Fiyat", render: (row) => `$${row.price}` },
					{ key: "carrier", header: "Kargo Firması", render: (row) => carrierName(row.carrierId) },
					{ key: "deci", header: "Desi Aralığı", render: (row) => deciRange(row.deciId) },
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

			<CarrierPriceFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				carriers={carriers}
				deciList={deciList}
				initialValues={editingItem}
				onSubmit={handleSubmit}
				isLoading={createItem.isPending || updateItem.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingItem)}
				onClose={() => setDeletingItem(null)}
				onConfirm={handleDelete}
				title="Kaydı sil"
				description="Bu kargo fiyatını silmek istediğinize emin misiniz?"
				isLoading={deleteItem.isPending}
			/>
		</div>
	);
}
