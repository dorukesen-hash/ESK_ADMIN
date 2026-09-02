"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CarrierFormModal from "@/components/fulfillment/CarrierFormModal";
import {
	useCarrierStats,
	useCreateCarrier,
	useUpdateCarrier,
	useDeleteCarrier,
} from "@/hooks/fulfillment/useCarriers";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function CarriersPage() {
	const [formOpen, setFormOpen] = useState(false);
	const [editingCarrier, setEditingCarrier] = useState(null);
	const [deletingCarrier, setDeletingCarrier] = useState(null);

	const { data: carriers = [], isLoading } = useCarrierStats();
	const createCarrier = useCreateCarrier();
	const updateCarrier = useUpdateCarrier();
	const deleteCarrier = useDeleteCarrier();

	const openCreate = () => {
		setEditingCarrier(null);
		setFormOpen(true);
	};

	const openEdit = (carrier) => {
		setEditingCarrier(carrier);
		setFormOpen(true);
	};

	const handleSubmit = async (values) => {
		try {
			if (editingCarrier) {
				await updateCarrier.mutateAsync({ id: editingCarrier.id, ...values });
				notifySuccess("Kargo firması güncellendi.");
			} else {
				await createCarrier.mutateAsync(values);
				notifySuccess("Kargo firması eklendi.");
			}
			setFormOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteCarrier.mutateAsync(deletingCarrier.id);
			notifySuccess("Kargo firması silindi.");
			setDeletingCarrier(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Kargo Firmaları"
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni Kargo Firması
						</span>
					</Button>
				}
			/>

			<DataTable
				isLoading={isLoading}
				rows={carriers}
				getRowId={(row) => row.id}
				emptyMessage="Kargo firması bulunamadı"
				columns={[
					{ key: "name", header: "Sağlayıcı" },
					{ key: "shipmentCount", header: "Gönderi Sayısı", render: (row) => row.shipmentCount ?? 0 },
					{
						key: "totalPaid",
						header: "Toplam Ödenen",
						render: (row) => `$${parseFloat(row.totalPaid ?? 0).toFixed(2)}`,
					},
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => openEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingCarrier(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<CarrierFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				initialValues={editingCarrier}
				onSubmit={handleSubmit}
				isLoading={createCarrier.isPending || updateCarrier.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingCarrier)}
				onClose={() => setDeletingCarrier(null)}
				onConfirm={handleDelete}
				title="Kargo firmasını sil"
				description={`"${deletingCarrier?.name}" kargo firmasını silmek istediğinize emin misiniz?`}
				isLoading={deleteCarrier.isPending}
			/>
		</div>
	);
}
