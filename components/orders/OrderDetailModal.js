"use client";

import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormField, { selectClass, inputClass, textareaClass } from "@/components/ui/FormField";
import VariantPicker from "@/components/catalog/VariantPicker";
import {
	useOrder,
	useUpdateOrder,
	useUpdateOrderStatus,
	useCompleteOrder,
	useUpdateOrderItemTracking,
	useUpdateOrderItems,
	useRefundOrder,
	useResendOrderConfirmation,
	useOrderAuditLog,
} from "@/hooks/orders/useOrders";
import { useOrderStatusList } from "@/hooks/orders/useOrderStatuses";
import { useCarriers } from "@/hooks/fulfillment/useCarriers";
import { useShipmentStatuses } from "@/hooks/fulfillment/useShipments";
import { notifySuccess, notifyError } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const REFUNDED_STATUS_ID = 6;
const CANCELLED_STATUS_ID = 5;

const AUDIT_ACTION_LABELS = {
	status_change: "Durum Değişikliği",
	refund: "İade",
	items_edit: "Kalemler Düzenlendi",
	manual_create: "Manuel Sipariş Oluşturuldu",
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
	const { data: shipmentStatuses = [] } = useShipmentStatuses();

	const updateStatus = useUpdateOrderStatus();
	const completeOrder = useCompleteOrder();
	const updateItemNote = useUpdateOrderItemTracking();
	const updateItems = useUpdateOrderItems();
	const updateOrder = useUpdateOrder();
	const refundOrder = useRefundOrder();
	const resendConfirmation = useResendOrderConfirmation();
	const { data: auditLog = [] } = useOrderAuditLog(orderId);

	const [statusId, setStatusId] = useState("");
	const [showComplete, setShowComplete] = useState(false);
	const [confirmingRefund, setConfirmingRefund] = useState(false);
	const [refundAmount, setRefundAmount] = useState("");
	const [carrierId, setCarrierId] = useState("");
	const [trackingNumber, setTrackingNumber] = useState("");
	const [shipmentstatusId, setShipmentstatusId] = useState("");
	const [itemNotes, setItemNotes] = useState({});
	const [editableItems, setEditableItems] = useState([]);
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
			setEditableItems(
				(order.orderitems ?? []).map((item) => ({
					id: item.id,
					title: item.title,
					code: item.code,
					price: item.price,
					quantity: item.quantity,
				}))
			);
			// Prefill with what's ACTUALLY left to refund (order.amountRemaining,
			// computed fresh from Stripe), not the original order total - after a
			// prior partial refund the full price would be wrong and dangerous
			// to suggest by default.
			setRefundAmount(order.amountRemaining ?? order.price ?? "");

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
			await completeOrder.mutateAsync({
				orderId,
				carrierId: Number(carrierId),
				trackingNumber,
				shipmentstatusId: shipmentstatusId ? Number(shipmentstatusId) : null,
			});
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
			const res = await refundOrder.mutateAsync({ orderId, amount: refundAmount ? Number(refundAmount) : undefined });
			notifySuccess(
				res.data?.isFullyRefunded
					? "Sipariş tamamen iade edildi."
					: `$${Number(res.data?.amountRefunded ?? 0).toFixed(2)} iade edildi (kısmi).`
			);
			setConfirmingRefund(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İade başarısız.");
			setConfirmingRefund(false);
		}
	};

	const updateEditableItem = (index, field, value) => {
		setEditableItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
	};

	const removeEditableItem = (index) => {
		setEditableItems((prev) => prev.filter((_, i) => i !== index));
	};

	const addEditableItem = (variant) => {
		setEditableItems((prev) => [...prev, { variantId: variant.id, title: variant.title, code: variant.stock, price: "", quantity: 1 }]);
	};

	const handleSaveItems = async () => {
		try {
			await updateItems.mutateAsync({
				orderId,
				items: editableItems.map((it) => ({
					id: it.id,
					variantId: it.variantId,
					title: it.title,
					price: parseFloat(it.price) || 0,
					quantity: parseInt(it.quantity, 10) || 1,
				})),
			});
			notifySuccess("Kalemler güncellendi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Kalemler güncellenemedi.");
		}
	};

	const handleResend = async () => {
		try {
			await resendConfirmation.mutateAsync(orderId);
			notifySuccess("Sipariş onay e-postası yeniden gönderildi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "E-posta gönderilemedi.");
		}
	};

	const statusName = (id) => statuses.find((s) => String(s.id) === String(id))?.name ?? `#${id}`;
	const formatAuditValue = (entry, value) => {
		if (value === null || value === undefined) return "-";
		return entry.field === "orderstatusId" ? statusName(value) : value;
	};
	// Every logOrderChange call already stores the real detail (refund
	// amount + Stripe refund id, old/new total, manual-order note) in
	// oldValue/newValue - only status_change was ever actually rendered here,
	// so a refund's amount was silently logged but invisible in the UI.
	const formatAuditDetail = (entry) => {
		if (entry.action === "status_change") {
			return `${formatAuditValue(entry, entry.oldValue)} -> ${formatAuditValue(entry, entry.newValue)}`;
		}
		if (entry.action === "items_edit") {
			return `$${Number(entry.oldValue ?? 0).toFixed(2)} -> $${Number(entry.newValue ?? 0).toFixed(2)}`;
		}
		if (entry.newValue) {
			return entry.newValue;
		}
		return null;
	};

	return (
		<Modal
			open={Boolean(orderId)}
			onClose={onClose}
			title={order ? `Sipariş #${order.orderNumber}` : "Sipariş"}
			maxWidth="max-w-6xl"
		>
			{isLoading || !order ? (
				<p className="text-sm text-text-light">Yükleniyor...</p>
			) : (
				<div className="max-h-[80vh] space-y-6 overflow-y-auto pr-1">
					<div className="grid grid-cols-1 gap-4 text-sm tablet:grid-cols-3">
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
						<div>
							<p className="text-text-light">Sipariş Bilgisi</p>
							<p className="text-text-dark">{order.orderstatus?.name ?? "-"}</p>
							<p className="text-text-light">
								{order.createdAt ? new Date(order.createdAt).toLocaleDateString("tr-TR") : "-"}
								{order.trackingNumber ? ` · Takip: ${order.trackingNumber}` : ""}
							</p>
						</div>
						<div>
							<p className="text-text-light">Ödeme</p>
							<p className="text-text-dark">
								${Number(order.price ?? 0).toFixed(2)}{" "}
								<span className={order.isPaid ? "text-green-600" : "text-red-500"}>
									({order.isPaid ? "Ödendi" : "Ödenmedi"})
								</span>
							</p>
							{order.amountRefunded > 0 && (
								<p className="text-text-light">
									İade Edilen: <span className="text-red-500">${Number(order.amountRefunded).toFixed(2)}</span>
									{" · "}Kalan: ${Number(order.amountRemaining ?? 0).toFixed(2)}
								</p>
							)}
						</div>
						<div>
							<p className="text-text-light">Kargo</p>
							<p className="text-text-dark">{order.shipment?.carrier?.name ?? "-"}</p>
							<p className="text-text-light">
								Ücret: ${Number(order.shipment?.totalPrice ?? 0).toFixed(2)}
								{order.shipment?.totalWeight ? ` · ${order.shipment.totalWeight} lb` : ""}
								{order.shipment?.totalDeci ? ` · ${order.shipment.totalDeci} deci` : ""}
							</p>
						</div>
					</div>

					{showAddressEdit && (
						<div className="space-y-4 bg-custom-table-soft-blue p-4">
						<div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
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
							{editableItems.map((item, index) => (
								<div
									key={item.id ?? `new-${index}`}
									className="flex items-start justify-between gap-4 border-b border-border-gray pb-3"
								>
									<div className="flex-1 text-sm">
										<p className="text-text-dark">
											{item.title} <span className="text-text-light">({item.code})</span>
										</p>
										<div className="mt-1 flex items-center gap-2">
											<input
												type="number"
												min="1"
												value={item.quantity}
												onChange={(e) => updateEditableItem(index, "quantity", e.target.value)}
												className={`${inputClass} w-16`}
											/>
											<span className="text-text-light">adet ×</span>
											<input
												type="number"
												step="0.01"
												value={item.price}
												onChange={(e) => updateEditableItem(index, "price", e.target.value)}
												className={`${inputClass} w-24`}
											/>
											<button
												type="button"
												onClick={() => removeEditableItem(index)}
												className="text-text-light hover:text-red-600"
											>
												<Trash2 size={14} />
											</button>
										</div>
										{item.id && (
											<div className="mt-2 flex items-start gap-2">
												<textarea
													value={itemNotes[item.id] ?? ""}
													onChange={(e) =>
														setItemNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
													}
													rows={1}
													placeholder="Not..."
													className={`${textareaClass} text-xs`}
												/>
												<button
													type="button"
													onClick={() => handleSaveItemNote(item.id)}
													className="text-text-light hover:text-custom-blue"
												>
													<Save size={16} />
												</button>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
						<div className="mt-3">
							<VariantPicker onSelect={addEditableItem} placeholder="Ürün ekle..." />
						</div>
						<div className="mt-3 flex items-center justify-between">
							<p className="text-xs text-text-light">
								Kalem değişiklikleri Stripe ödemesine otomatik yansımaz - fark varsa iade/ek tahsilat elle
								yapılmalı.
							</p>
							<Button onClick={handleSaveItems} isLoading={updateItems.isPending}>
								Kalemleri Kaydet
							</Button>
						</div>
					</div>

					<div className="flex flex-wrap items-end gap-4 border-t border-border-gray pt-4">
						<FormField label="Durum">
							<select value={statusId} onChange={(e) => setStatusId(e.target.value)} className={selectClass}>
								{statuses.map((s) => {
									const isCancelledLocked =
										s.id === CANCELLED_STATUS_ID && order.isPaid && order.orderstatusId !== REFUNDED_STATUS_ID;
									return (
										<option
											key={s.id}
											value={s.id}
											disabled={isCancelledLocked}
											title={isCancelledLocked ? "Ödenmiş sipariş - önce iade edin" : undefined}
										>
											{s.name}
											{isCancelledLocked ? " (önce iade edin)" : ""}
										</option>
									);
								})}
							</select>
						</FormField>
						<Button onClick={handleStatusSave} isLoading={updateStatus.isPending} disabled={!statusId}>
							Durumu Kaydet
						</Button>

						{order.orderstatusId !== 3 && (
							<Button
								variant="secondary"
								onClick={() => {
									if (!showComplete) {
										const shipped = shipmentStatuses.find((s) => s.name === "Shipped");
										if (shipped) setShipmentstatusId(String(shipped.id));
									}
									setShowComplete((v) => !v);
								}}
							>
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

						<a
							href={`${API_URL}/invoices/packing-slip/${order.id}`}
							target="_blank"
							rel="noreferrer"
							className="text-sm text-custom-blue hover:underline"
						>
							Fişi Yazdır
						</a>

						<button
							type="button"
							onClick={handleResend}
							disabled={resendConfirmation.isPending}
							className="text-sm text-custom-blue hover:underline disabled:opacity-50"
						>
							E-postayı Yeniden Gönder
						</button>
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
							<FormField label="Kargo Durumu">
								<select
									value={shipmentstatusId}
									onChange={(e) => setShipmentstatusId(e.target.value)}
									className={selectClass}
								>
									<option value="">Belirtilmedi</option>
									{shipmentStatuses.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
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
											{formatAuditDetail(entry) && <>: {formatAuditDetail(entry)}</>}
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
				description="Bu tutar Stripe üzerinden iade edilecek. Tam tutar iade edilirse durum 'Refunded' olur; kısmi iade durumu değiştirmez. Bu işlem geri alınamaz."
				confirmLabel="İade Et"
				confirmVariant="danger"
				isLoading={refundOrder.isPending}
			>
				<FormField label="İade Tutarı ($)">
					<input
						type="number"
						step="0.01"
						min="0.01"
						value={refundAmount}
						onChange={(e) => setRefundAmount(e.target.value)}
						className={inputClass}
					/>
				</FormField>
			</ConfirmDialog>
		</Modal>
	);
}
