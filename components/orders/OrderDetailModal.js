"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { selectClass, inputClass, textareaClass } from "@/components/ui/FormField";
import {
	useOrder,
	useUpdateOrderStatus,
	useCompleteOrder,
	useUpdateOrderItemTracking,
} from "@/hooks/orders/useOrders";
import { useOrderStatusList } from "@/hooks/orders/useOrderStatuses";
import { useCarriers } from "@/hooks/fulfillment/useCarriers";
import { notifySuccess, notifyError } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function OrderDetailModal({ orderId, onClose }) {
	const { data: order, isLoading } = useOrder(orderId);
	const { data: statuses = [] } = useOrderStatusList();
	const { data: carriers = [] } = useCarriers();

	const updateStatus = useUpdateOrderStatus();
	const completeOrder = useCompleteOrder();
	const updateItemNote = useUpdateOrderItemTracking();

	const [statusId, setStatusId] = useState("");
	const [showComplete, setShowComplete] = useState(false);
	const [carrierId, setCarrierId] = useState("");
	const [trackingNumber, setTrackingNumber] = useState("");
	const [itemNotes, setItemNotes] = useState({});

	useEffect(() => {
		if (order) {
			setStatusId(order.orderstatusId ? String(order.orderstatusId) : "");
			setTrackingNumber(order.trackingNumber ?? "");
			const notes = {};
			(order.orderitems ?? []).forEach((item) => {
				notes[item.id] = item.note ?? "";
			});
			setItemNotes(notes);
		}
	}, [order]);

	if (!orderId) return null;

	const handleStatusSave = async () => {
		if (!statusId) return;
		try {
			await updateStatus.mutateAsync({ orderId, orderStatusId: Number(statusId) });
			notifySuccess("Durum güncellendi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncellenemedi.");
		}
	};

	const handleComplete = async () => {
		if (!carrierId || !trackingNumber) return;
		try {
			await completeOrder.mutateAsync({ orderId, carrierId: Number(carrierId), trackingNumber });
			notifySuccess("İşlem tamamlandı.");
			setShowComplete(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleSaveItemNote = async (itemId) => {
		try {
			await updateItemNote.mutateAsync({ orderItemId: itemId, note: itemNotes[itemId] ?? "" });
			notifySuccess("Not kaydedildi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Not kaydedilemedi.");
		}
	};

	return (
		<Modal
			open={Boolean(orderId)}
			onClose={onClose}
			title={order ? `Sipariş #${order.orderNumber}` : "Sipariş"}
			maxWidth="max-w-2xl"
		>
			{isLoading || !order ? (
				<p className="text-sm text-text-light">Yükleniyor...</p>
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-text-light">Müşteri</p>
							<p className="text-text-dark">
								{order.customer?.name} {order.customer?.surname}
							</p>
							<p className="text-text-light">{order.customer?.email}</p>
						</div>
						<div>
							<p className="text-text-light">Adres</p>
							<p className="text-text-dark">
								{order.firstline} {order.secondline}
							</p>
							<p className="text-text-dark">
								{order.city}, {order.state} {order.zip}
							</p>
						</div>
					</div>

					<div>
						<p className="mb-2 text-sm font-medium text-text-dark">Ürünler</p>
						<div className="space-y-3">
							{(order.orderitems ?? []).map((item) => (
								<div
									key={item.id}
									className="flex items-start justify-between gap-4 border-b border-border-gray pb-3"
								>
									<div className="text-sm">
										<p className="text-text-dark">{item.title}</p>
										<p className="text-text-light">
											{item.code} · {item.quantity} adet · ${item.price}
										</p>
									</div>
									<div className="flex w-56 shrink-0 items-start gap-2">
										<textarea
											value={itemNotes[item.id] ?? ""}
											onChange={(e) =>
												setItemNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
											}
											rows={2}
											placeholder="Not..."
											className={`${textareaClass} text-xs`}
										/>
										<button
											type="button"
											onClick={() => handleSaveItemNote(item.id)}
											className="mt-1 text-text-light hover:text-custom-blue"
										>
											<Save size={16} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-wrap items-end gap-4 border-t border-border-gray pt-4">
						<FormField label="Durum">
							<select value={statusId} onChange={(e) => setStatusId(e.target.value)} className={selectClass}>
								{statuses.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
						</FormField>
						<Button onClick={handleStatusSave} isLoading={updateStatus.isPending} disabled={!statusId}>
							Durumu Kaydet
						</Button>

						{!order.shipmentId && (
							<Button variant="secondary" onClick={() => setShowComplete((v) => !v)}>
								Siparişi Tamamla
							</Button>
						)}

						<a
							href={`${API_URL}/invoices/pdf/${order.id}`}
							target="_blank"
							rel="noreferrer"
							className="text-sm text-custom-blue hover:underline"
						>
							Fatura PDF
						</a>
					</div>

					{showComplete && (
						<div className="flex flex-wrap items-end gap-4 bg-custom-table-soft-blue p-4">
							<FormField label="Kargo Firması">
								<select value={carrierId} onChange={(e) => setCarrierId(e.target.value)} className={selectClass}>
									<option value="">Seçiniz</option>
									{carriers.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</FormField>
							<FormField label="Takip Numarası">
								<input
									value={trackingNumber}
									onChange={(e) => setTrackingNumber(e.target.value)}
									className={inputClass}
								/>
							</FormField>
							<Button
								onClick={handleComplete}
								isLoading={completeOrder.isPending}
								disabled={!carrierId || !trackingNumber}
							>
								Onayla
							</Button>
						</div>
					)}
				</div>
			)}
		</Modal>
	);
}
