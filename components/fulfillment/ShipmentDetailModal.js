"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, textareaClass, selectClass } from "@/components/ui/FormField";
import { useShipment, useUpdateShipment, useShipmentStatuses } from "@/hooks/fulfillment/useShipments";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function ShipmentDetailModal({ shipmentId, onClose }) {
	const { data: shipment, isLoading } = useShipment(shipmentId);
	const { data: statuses = [] } = useShipmentStatuses();
	const updateShipment = useUpdateShipment();

	const [tracking, setTracking] = useState("");
	const [adminNote, setAdminNote] = useState("");
	const [shipmentstatusId, setShipmentstatusId] = useState("");

	useEffect(() => {
		if (shipment) {
			setTracking(shipment.tracking ?? "");
			setAdminNote(shipment.extra_informations?.adminNote ?? "");
			setShipmentstatusId(shipment.shipmentstatusId ? String(shipment.shipmentstatusId) : "");
		}
	}, [shipment]);

	if (!shipmentId) return null;

	const handleSave = async () => {
		try {
			await updateShipment.mutateAsync({
				id: shipmentId,
				tracking,
				adminNote,
				shipmentstatusId: shipmentstatusId ? Number(shipmentstatusId) : null,
			});
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

					<FormField label="Kargo Durumu">
						<select value={shipmentstatusId} onChange={(e) => setShipmentstatusId(e.target.value)} className={selectClass}>
							<option value="">Belirtilmedi</option>
							{statuses.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
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
