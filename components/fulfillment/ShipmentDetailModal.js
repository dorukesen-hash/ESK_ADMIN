"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, textareaClass } from "@/components/ui/FormField";
import { useShipment, useUpdateShipment } from "@/hooks/fulfillment/useShipments";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function ShipmentDetailModal({ shipmentId, onClose }) {
	const { data: shipment, isLoading } = useShipment(shipmentId);
	const updateShipment = useUpdateShipment();

	const [tracking, setTracking] = useState("");
	const [adminNote, setAdminNote] = useState("");

	useEffect(() => {
		if (shipment) {
			setTracking(shipment.tracking ?? "");
			setAdminNote(shipment.extra_informations?.adminNote ?? "");
		}
	}, [shipment]);

	if (!shipmentId) return null;

	const handleSave = async () => {
		try {
			await updateShipment.mutateAsync({ id: shipmentId, tracking, adminNote });
			notifySuccess("Gönderi güncellendi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncelleme başarısız.");
		}
	};

	return (
		<Modal open={Boolean(shipmentId)} onClose={onClose} title="Gönderi Detayı">
			{isLoading || !shipment ? (
				<p className="text-sm text-text-light">Yükleniyor...</p>
			) : (
				<div className="space-y-4">
					<div className="text-sm">
						<p className="text-text-dark">{shipment.name}</p>
						<p className="text-text-light">
							{shipment.firstline} {shipment.secondline}
						</p>
						<p className="text-text-light">
							{shipment.city}, {shipment.state} {shipment.zip}
						</p>
						<p className="mt-2 text-text-light">Kargo Firması: {shipment.carrier?.name ?? "-"}</p>
					</div>

					<FormField label="Takip Numarası">
						<input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputClass} />
					</FormField>

					<FormField label="Not">
						<textarea
							value={adminNote}
							onChange={(e) => setAdminNote(e.target.value)}
							rows={3}
							className={textareaClass}
						/>
					</FormField>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Kapat
						</Button>
						<Button onClick={handleSave} isLoading={updateShipment.isPending}>
							Kaydet
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
