"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { selectClass } from "@/components/ui/FormField";
import VariantPicker from "@/components/catalog/VariantPicker";
import { useSubcategories } from "@/hooks/catalog/useSubcategories";
import { useProducts } from "@/hooks/catalog/useProducts";
import { useAttachImages } from "@/hooks/media/useImages";
import { notifySuccess, notifyError } from "@/lib/toast";

const TARGET_LABELS = {
	product: "Ürün",
	subcategory: "Alt Kategori",
	variant: "Varyant",
};

export default function AttachImagesModal({ open, onClose, imageIds, onDone }) {
	const [target, setTarget] = useState("product");
	const [targetId, setTargetId] = useState("");
	const [selectedVariant, setSelectedVariant] = useState(null);

	const { data: subcategories = [] } = useSubcategories();
	const { data: products = [] } = useProducts();
	const attachImages = useAttachImages();

	const options = target === "subcategory" ? subcategories : target === "product" ? products : [];
	const optionLabel = (opt) => opt.name ?? opt.title;
	const resolvedTargetId = target === "variant" ? selectedVariant?.id : targetId;

	const changeTarget = (value) => {
		setTarget(value);
		setTargetId("");
		setSelectedVariant(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!resolvedTargetId) return;
		try {
			await attachImages.mutateAsync({ ids: imageIds, target, targetId: resolvedTargetId });
			notifySuccess("Görseller atandı.");
			onDone();
		} catch (error) {
			notifyError(error?.response?.data?.message || "Atama başarısız.");
		}
	};

	return (
		<Modal open={open} onClose={onClose} title="Görselleri Ata">
			<form onSubmit={handleSubmit} className="space-y-4">
				<p className="text-sm text-text-light">
					{imageIds.length} görsel seçili. Bu işlem, hedefin mevcut görsellerinin yerini alır.
				</p>

				<FormField label="Hedef Tipi">
					<select value={target} onChange={(e) => changeTarget(e.target.value)} className={selectClass}>
						{Object.entries(TARGET_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</FormField>

				{target === "variant" ? (
					<FormField label="Varyant">
						{selectedVariant ? (
							<div className="flex items-center justify-between border border-border-gray px-3 py-2 text-sm text-text-dark">
								<span>
									{selectedVariant.title} <span className="text-text-light">({selectedVariant.stock})</span>
								</span>
								<button
									type="button"
									onClick={() => setSelectedVariant(null)}
									className="text-text-light hover:text-red-600"
								>
									Değiştir
								</button>
							</div>
						) : (
							<VariantPicker onSelect={setSelectedVariant} />
						)}
					</FormField>
				) : (
					<FormField label={TARGET_LABELS[target]}>
						<select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={selectClass}>
							<option value="">Seçiniz</option>
							{options.map((opt) => (
								<option key={opt.id} value={opt.id}>
									{optionLabel(opt)}
								</option>
							))}
						</select>
					</FormField>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={attachImages.isPending} disabled={!resolvedTargetId}>
						Ata
					</Button>
				</div>
			</form>
		</Modal>
	);
}
