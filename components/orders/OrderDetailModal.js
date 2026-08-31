"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormField, { selectClass, inputClass, textareaClass } from "@/components/ui/FormField";
import {
	useOrder,
	useUpdateOrder,
	useUpdateOrderStatus,
	useCompleteOrder,
	useUpdateOrderItemTracking,
	useRefundOrder,
	useOrderAuditLog,
} from "@/hooks/orders/useOrders";
import { useOrderStatusList } from "@/hooks/orders/useOrderStatuses";
import { useCarriers } from "@/hooks/fulfillment/useCarriers";
import { notifySuccess, notifyError } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const REFUNDED_STATUS_ID = 6;

const AUDIT_ACTION_LABELS = {
	status_change: "Durum Değişikliği",
	refund: "İade",
};

function formatAuditUser(user) {
	if (!user) return "Sistem";
	const name = `${user.name ?? ""} ${user.surname ?? ""}`.trim();
	return name || user.email || "Sistem";
}

export default function OrderDetailModal({ orderId, onClose }) {
	const { data: order, isLoading } = useOrder(orderId);
	const { data: statuses = [] } = useOrderStatusList();
	const { data: carriers = [] } = useCarriers();

	const updateStatus = useUpdateOrderStatus();
	const completeOrder = useCompleteOrder();
	const updateItemNote = useUpdateOrderItemTracking();
	const updateOrder = useUpdateOrder();
	const refundOrder = useRefundOrder();
	const { data: auditLog = [] } = useOrderAuditLog(orderId);

	const [statusId, setStatusId] = useState("");
	const [showComplete, setShowComplete] = useState(false);
	const [confirmingRefund, setConfirmingRefund] = useState(false);
	const [carrierId, setCarrierId] = useState("");
	const [trackingNumber, setTrackingNumber] = useState("");
	const [itemNotes, setItemNotes] = useState({});
	const [showAddressEdit, setShowAddressEdit] = useState(false);
	const [shippingForm, setShippingForm] = useState({});
	const [billingForm, setBillingForm] = useState({});
	const [adminNote, setAdminNote] = useState("");

	useEffect(() => {
		if (order) {
			setStatusId(order.orderstatusId ? String(order.orderstatusId) : "");
			setTrackingNumber(order.trackingNumber ?? "");
			const notes = {};
			(order.orderitems ?? []).forEach((item) => {
				notes[item.id] = item.note ?? "";
			});
			setItemNotes(notes);

			setShippingForm({
				name: order.name ?? "",
				firstline: order.firstline ?? "",
				secondline: order.secondline ?? "",
				email: order.email ?? "",
				phone: order.phone ?? "",
				city: order.city ?? "",
				state: order.state ?? "",
				zip: order.zip ?? "",
			});
			setBillingForm({
				id: order.billing?.id,
				name: order.billing?.name ?? "",
				firstline: order.billing?.firstline ?? "",
				secondline: order.billing?.secondline ?? "",
				phone: order.billing?.phone ?? "",
				city: order.billing?.city ?? "",
				state: order.billing?.state ?? "",
				zip: order.billing?.zip ?? "",
				email: order.billing?.extra_informations?.email ?? "",
			});
			setAdminNote(order.extra_informations?.adminNote ?? "");
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

	const handleSaveAddress = async () => {
		try {
			await updateOrder.mutateAsync({
				id: orderId,
				shippingAddress: shippingForm,
				billingAddress: {
					id: billingForm.id,
					name: billingForm.name,
					firstline: billingForm.firstline,
					secondline: billingForm.secondline,
					phone: billingForm.phone,
					city: billingForm.city,
					state: billingForm.state,
					zip: billingForm.zip,
					extra_informations: { email: billingForm.email },
				},
				adminNote,
			});
			notifySuccess("Adres bilgileri güncellendi.");
			setShowAddressEdit(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncellenemedi.");
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

	const handleRefund = async () => {
		try {
			await refundOrder.mutateAsync(orderId);
			notifySuccess("Sipariş iade edildi.");
			setConfirmingRefund(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İade başarısız.");
			setConfirmingRefund(false);
		}
	};

	const statusName = (id) => statuses.find((s) => String(s.id) === String(id))?.name ?? `#${id}`;
	const formatAuditValue = (entry, value) => {
		if (value === null || value === undefined) return "-";
		return entry.field === "orderstatusId" ? statusName(value) : value;
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
							<div className="flex items-center justify-between">
								<p className="text-text-light">Kargo Adresi</p>
								<button
									type="button"
									onClick={() => setShowAddressEdit((v) => !v)}
									className="text-xs text-custom-blue hover:underline"
								>
									{showAddressEdit ? "Kapat" : "Düzenle"}
								</button>
							</div>
							<p className="text-text-dark">
								{order.firstline} {order.secondline}
							</p>
							<p className="text-text-dark">
								{order.city}, {order.state} {order.zip}
							</p>
						</div>
					</div>

					{showAddressEdit && (
						<div className="space-y-4 bg-custom-table-soft-blue p-4">
							<div>
								<p className="mb-2 text-sm font-medium text-text-dark">Kargo Adresi</p>
								<div className="grid grid-cols-2 gap-3">
									<FormField label="Ad Soyad">
										<input
											value={shippingForm.name ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, name: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="E-posta">
										<input
											value={shippingForm.email ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, email: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Telefon">
										<input
											value={shippingForm.phone ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, phone: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Adres Satırı 1">
										<input
											value={shippingForm.firstline ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, firstline: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Adres Satırı 2">
										<input
											value={shippingForm.secondline ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, secondline: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Şehir">
										<input
											value={shippingForm.city ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, city: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Eyalet">
										<input
											value={shippingForm.state ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, state: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Posta Kodu">
										<input
											value={shippingForm.zip ?? ""}
											onChange={(e) => setShippingForm((f) => ({ ...f, zip: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
								</div>
							</div>

							<div>
								<p className="mb-2 text-sm font-medium text-text-dark">Fatura Adresi</p>
								<div className="grid grid-cols-2 gap-3">
									<FormField label="Ad Soyad">
										<input
											value={billingForm.name ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, name: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="E-posta">
										<input
											value={billingForm.email ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, email: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Telefon">
										<input
											value={billingForm.phone ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, phone: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Adres Satırı 1">
										<input
											value={billingForm.firstline ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, firstline: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Adres Satırı 2">
										<input
											value={billingForm.secondline ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, secondline: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Şehir">
										<input
											value={billingForm.city ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, city: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Eyalet">
										<input
											value={billingForm.state ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, state: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
									<FormField label="Posta Kodu">
										<input
											value={billingForm.zip ?? ""}
											onChange={(e) => setBillingForm((f) => ({ ...f, zip: e.target.value }))}
											className={inputClass}
										/>
									</FormField>
								</div>
							</div>

							<FormField label="Admin Notu">
								<textarea
									value={adminNote}
									onChange={(e) => setAdminNote(e.target.value)}
									rows={2}
									className={textareaClass}
								/>
							</FormField>

							<div className="flex justify-end">
								<Button onClick={handleSaveAddress} isLoading={updateOrder.isPending}>
									Adres Bilgilerini Kaydet
								</Button>
							</div>
						</div>
					)}

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

						{order.isPaid && order.orderstatusId !== REFUNDED_STATUS_ID && (
							<Button variant="danger" onClick={() => setConfirmingRefund(true)} isLoading={refundOrder.isPending}>
								İade Et
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

					{auditLog.length > 0 && (
						<div className="border-t border-border-gray pt-4">
							<p className="mb-2 text-sm font-medium text-text-dark">Sipariş Geçmişi</p>
							<div className="space-y-1 text-xs">
								{auditLog.map((entry) => (
									<div key={entry.id} className="flex items-center justify-between text-text-light">
										<span>
											{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
											{entry.action === "status_change" && (
												<>
													: {formatAuditValue(entry, entry.oldValue)} {"->"} {formatAuditValue(entry, entry.newValue)}
												</>
											)}
											{" · "}
											{formatAuditUser(entry.actor)}
										</span>
										<span>{new Date(entry.createdAt).toLocaleString("tr-TR")}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			<ConfirmDialog
				open={confirmingRefund}
				onClose={() => setConfirmingRefund(false)}
				onConfirm={handleRefund}
				title="Siparişi iade et"
				description="Bu siparişin ödemesi Stripe üzerinden iade edilecek ve durumu 'Refunded' olarak güncellenecek. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?"
				confirmLabel="İade Et"
				confirmVariant="danger"
				isLoading={refundOrder.isPending}
			/>
		</Modal>
	);
}
