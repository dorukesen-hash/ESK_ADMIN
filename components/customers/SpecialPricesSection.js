"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { inputClass } from "@/components/ui/FormField";
import VariantPicker from "@/components/catalog/VariantPicker";
import { useSpecialPrices, useUpsertSpecialPrice, useDeleteSpecialPrice } from "@/hooks/customers/useSpecialPrices";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function SpecialPricesSection({ userId }) {
	const { data: overrides = [], isLoading } = useSpecialPrices(userId);
	const upsert = useUpsertSpecialPrice();
	const remove = useDeleteSpecialPrice();
	const [pickedVariant, setPickedVariant] = useState(null);
	const [price, setPrice] = useState("");
	const [deletingId, setDeletingId] = useState(null);

	const handleAdd = async () => {
		if (!pickedVariant || !price) return;
		try {
			await upsert.mutateAsync({ userId, variantId: pickedVariant.id, price: parseFloat(price) });
			notifySuccess("Özel fiyat kaydedildi.");
			setPickedVariant(null);
			setPrice("");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Kaydedilemedi.");
		}
	};

	const handleDelete = async (id) => {
		try {
			await remove.mutateAsync({ id, userId });
			notifySuccess("Özel fiyat kaldırıldı.");
			setDeletingId(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Kaldırılamadı.");
		}
	};

	return (
		<div>
			<h3 className="mb-2 font-medium text-text-dark">Ürün Bazlı Özel Fiyat</h3>

			<div className="mb-3 flex flex-wrap items-start gap-2">
				<div className="min-w-[240px] flex-1">
					{pickedVariant ? (
						<div className="flex items-center justify-between border border-border-gray px-3 py-2 text-sm">
							<span>
								{pickedVariant.title} <span className="text-text-light">({pickedVariant.stock})</span>
							</span>
							<button type="button" onClick={() => setPickedVariant(null)} className="text-text-light hover:text-text-dark">
								✕
							</button>
						</div>
					) : (
						<VariantPicker
							onSelect={setPickedVariant}
							excludeIds={overrides.map((o) => o.variantId)}
							placeholder="Ürün ara..."
						/>
					)}
				</div>
				<input
					type="number"
					step="0.01"
					value={price}
					onChange={(e) => setPrice(e.target.value)}
					placeholder="Fiyat"
					className={`${inputClass} w-28`}
				/>
				<Button type="button" onClick={handleAdd} isLoading={upsert.isPending} disabled={!pickedVariant || !price}>
					Ekle
				</Button>
			</div>

			{isLoading ? (
				<p className="text-sm text-text-light">Yükleniyor...</p>
			) : overrides.length === 0 ? (
				<p className="text-sm text-text-light">Özel fiyat tanımlanmamış.</p>
			) : (
				<table className="w-full text-sm">
					<tbody>
						{overrides.map((o) => (
							<tr key={o.id} className="border-b border-border-gray">
								<td className="py-2">
									{o.variant?.title ?? `Varyant #${o.variantId}`}{" "}
									<span className="text-text-light">({o.variant?.stock})</span>
								</td>
								<td className="py-2 text-right font-medium">${parseFloat(o.price).toFixed(2)}</td>
								<td className="w-8 py-2 text-right">
									<button
										type="button"
										onClick={() => setDeletingId(o.id)}
										className="text-text-light hover:text-red-600"
									>
										<Trash2 size={16} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<ConfirmDialog
				open={Boolean(deletingId)}
				onClose={() => setDeletingId(null)}
				onConfirm={() => handleDelete(deletingId)}
				title="Özel fiyatı kaldır"
				description="Bu ürün için özel fiyatı kaldırmak istediğinize emin misiniz?"
				isLoading={remove.isPending}
			/>
		</div>
	);
}
