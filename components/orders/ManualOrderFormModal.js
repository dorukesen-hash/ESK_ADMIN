"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, checkboxClass } from "@/components/ui/FormField";
import SearchInput from "@/components/ui/SearchInput";
import VariantPicker from "@/components/catalog/VariantPicker";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useCreateManualOrder } from "@/hooks/orders/useOrders";
import { notifySuccess, notifyError } from "@/lib/toast";

const emptyAddress = { name: "", firstline: "", secondline: "", city: "", state: "", zip: "", phone: "", email: "" };

// Phone/email orders paid outside Stripe (wire, check, etc.) - skips the
// checkout/PaymentIntent path entirely. Billing and recipient both use the
// single address entered here (the common case for this kind of order);
// the backend accepts them independently if that's ever not enough.
export default function ManualOrderFormModal({ open, onClose }) {
	const [customerQuery, setCustomerQuery] = useState("");
	const { data: customerResults } = useCustomers({ search: customerQuery });
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [newCustomer, setNewCustomer] = useState({ name: "", surname: "", email: "", phone: "" });
	const [useNewCustomer, setUseNewCustomer] = useState(false);

	const [address, setAddress] = useState(emptyAddress);
	const [items, setItems] = useState([]);
	const [carrierName, setCarrierName] = useState("");
	const [shippingPrice, setShippingPrice] = useState("0");
	const [isPaid, setIsPaid] = useState(true);
	const [paymentNote, setPaymentNote] = useState("");

	const createManualOrder = useCreateManualOrder();

	const reset = () => {
		setCustomerQuery("");
		setSelectedCustomer(null);
		setNewCustomer({ name: "", surname: "", email: "", phone: "" });
		setUseNewCustomer(false);
		setAddress(emptyAddress);
		setItems([]);
		setCarrierName("");
		setShippingPrice("0");
		setIsPaid(true);
		setPaymentNote("");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const addItem = (variant) => {
		setItems((prev) => [...prev, { variantId: variant.id, title: variant.title, stock: variant.stock, price: "", quantity: 1 }]);
	};

	const updateItem = (index, field, value) => {
		setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
	};

	const removeItem = (index) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	const itemsTotal = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
	const total = itemsTotal + (parseFloat(shippingPrice) || 0);

	const handleSubmit = async () => {
		if (!useNewCustomer && !selectedCustomer) {
			notifyError("Bir müşteri seçin veya yeni müşteri bilgisi girin.");
			return;
		}
		if (useNewCustomer && !newCustomer.email) {
			notifyError("Yeni müşteri için e-posta zorunlu.");
			return;
		}
		if (items.length === 0) {
			notifyError("En az bir ürün eklenmeli.");
			return;
		}

		const addressPayload = {
			name: address.name,
			firstline: address.firstline,
			secondline: address.secondline,
			city: address.city,
			state: address.state,
			zip: address.zip,
			phone: address.phone,
			email: address.email,
		};

		try {
			await createManualOrder.mutateAsync({
				customerId: useNewCustomer ? undefined : selectedCustomer?.id,
				newCustomer: useNewCustomer ? newCustomer : undefined,
				recipient: addressPayload,
				billing: { ...addressPayload, firstname: address.name },
				shipping: { carrier: carrierName, price: parseFloat(shippingPrice) || 0 },
				items: items.map((it) => ({ variantId: it.variantId, price: parseFloat(it.price) || 0, quantity: parseInt(it.quantity, 10) || 1 })),
				isPaid,
				paymentNote,
			});
			notifySuccess("Sipariş oluşturuldu.");
			handleClose();
		} catch (error) {
			notifyError(error?.response?.data?.message || "Sipariş oluşturulamadı.");
		}
	};

	return (
		<Modal open={open} onClose={handleClose} title="Yeni Sipariş (Manuel)" maxWidth="max-w-2xl">
			<div className="space-y-4">
				<div>
					<p className="mb-2 text-sm font-medium text-text-dark">Müşteri</p>
					{!useNewCustomer ? (
						<div className="space-y-2">
							{selectedCustomer ? (
								<div className="flex items-center justify-between border border-border-gray px-3 py-2 text-sm">
									<span>
										{selectedCustomer.name} {selectedCustomer.surname}{" "}
										<span className="text-text-light">({selectedCustomer.email})</span>
									</span>
									<button type="button" onClick={() => setSelectedCustomer(null)} className="text-text-light hover:text-text-dark">
										✕
									</button>
								</div>
							) : (
								<>
									<SearchInput value={customerQuery} onChange={setCustomerQuery} placeholder="Müşteri ara (isim/e-posta/telefon)..." />
									{customerQuery.length > 1 && (
										<div className="mt-1 max-h-40 overflow-y-auto border border-border-gray bg-white shadow-custom">
											{(customerResults?.rows ?? []).map((c) => (
												<button
													key={c.id}
													type="button"
													onClick={() => {
														setSelectedCustomer(c);
														setCustomerQuery("");
													}}
													className="block w-full px-3 py-2 text-left text-sm hover:bg-custom-table-soft-blue"
												>
													{c.name} {c.surname} <span className="text-text-light">({c.email})</span>
												</button>
											))}
											{(customerResults?.rows ?? []).length === 0 && (
												<div className="px-3 py-2 text-sm text-text-light">Sonuç yok</div>
											)}
										</div>
									)}
								</>
							)}
							<button type="button" onClick={() => setUseNewCustomer(true)} className="text-xs text-custom-blue hover:underline">
								Yeni müşteri gir
							</button>
						</div>
					) : (
						<div className="space-y-2">
							<div className="grid grid-cols-2 gap-2">
								<input placeholder="Ad" value={newCustomer.name} onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
								<input placeholder="Soyad" value={newCustomer.surname} onChange={(e) => setNewCustomer((p) => ({ ...p, surname: e.target.value }))} className={inputClass} />
								<input placeholder="E-posta" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
								<input placeholder="Telefon" value={newCustomer.phone} onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
							</div>
							<button type="button" onClick={() => setUseNewCustomer(false)} className="text-xs text-custom-blue hover:underline">
								Mevcut müşteri seç
							</button>
						</div>
					)}
				</div>

				<div>
					<p className="mb-2 text-sm font-medium text-text-dark">Teslimat / Fatura Adresi</p>
					<div className="grid grid-cols-2 gap-2">
						<input placeholder="Ad Soyad" value={address.name} onChange={(e) => setAddress((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
						<input placeholder="Telefon" value={address.phone} onChange={(e) => setAddress((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
						<input placeholder="Adres Satırı 1" value={address.firstline} onChange={(e) => setAddress((p) => ({ ...p, firstline: e.target.value }))} className={`${inputClass} col-span-2`} />
						<input placeholder="Adres Satırı 2" value={address.secondline} onChange={(e) => setAddress((p) => ({ ...p, secondline: e.target.value }))} className={`${inputClass} col-span-2`} />
						<input placeholder="Şehir" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} className={inputClass} />
						<input placeholder="Eyalet" value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))} className={inputClass} />
						<input placeholder="Posta Kodu" value={address.zip} onChange={(e) => setAddress((p) => ({ ...p, zip: e.target.value }))} className={inputClass} />
					</div>
				</div>

				<div>
					<p className="mb-2 text-sm font-medium text-text-dark">Ürünler</p>
					<VariantPicker onSelect={addItem} excludeIds={items.map((i) => i.variantId)} placeholder="Ürün ara ve ekle..." />
					{items.length > 0 && (
						<table className="mt-2 w-full text-sm">
							<tbody>
								{items.map((item, index) => (
									<tr key={index} className="border-b border-border-gray">
										<td className="py-2">
											{item.title} <span className="text-text-light">({item.stock})</span>
										</td>
										<td className="w-20 py-2">
											<input
												type="number"
												min="1"
												value={item.quantity}
												onChange={(e) => updateItem(index, "quantity", e.target.value)}
												className={`${inputClass} w-full`}
											/>
										</td>
										<td className="w-28 py-2">
											<input
												type="number"
												step="0.01"
												placeholder="Fiyat"
												value={item.price}
												onChange={(e) => updateItem(index, "price", e.target.value)}
												className={`${inputClass} w-full`}
											/>
										</td>
										<td className="w-8 py-2 text-right">
											<button type="button" onClick={() => removeItem(index)} className="text-text-light hover:text-red-600">
												<Trash2 size={16} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<FormField label="Kargo Firması">
						<input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} className={inputClass} />
					</FormField>
					<FormField label="Kargo Ücreti">
						<input type="number" step="0.01" value={shippingPrice} onChange={(e) => setShippingPrice(e.target.value)} className={inputClass} />
					</FormField>
				</div>

				<label className="flex items-center gap-2 text-sm text-text-dark">
					<input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className={checkboxClass} />
					Ödeme alındı
				</label>

				<FormField label="Ödeme Notu (ör. Havale/EFT, çek no...)">
					<input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className={inputClass} />
				</FormField>

				<div className="flex items-center justify-between border-t border-border-gray pt-3">
					<span className="text-sm font-semibold text-text-dark">Toplam: ${total.toFixed(2)}</span>
					<div className="flex gap-2">
						<Button type="button" variant="secondary" onClick={handleClose}>
							Vazgeç
						</Button>
						<Button onClick={handleSubmit} isLoading={createManualOrder.isPending}>
							Siparişi Oluştur
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
