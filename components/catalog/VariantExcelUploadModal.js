"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { selectClass } from "@/components/ui/FormField";

const HIERARCHY_LABELS = {
	category: "Kategori",
	subcategory: "Alt Kategori",
	product: "Ürün",
};

// initialHierarchy: { type: 'category'|'subcategory'|'product', id, label } -
// when set (opened from within a Catalog section), the target is pre-filled
// and locked instead of requiring the manual picker below.
export default function VariantExcelUploadModal({
	open,
	onClose,
	categories,
	subcategories,
	products,
	initialHierarchy,
	onSubmit,
	isLoading,
}) {
	const [hierarchyType, setHierarchyType] = useState("category");
	const [hierarchyId, setHierarchyId] = useState("");
	const [file, setFile] = useState(null);

	const locked = Boolean(initialHierarchy);

	useEffect(() => {
		if (!open) return;
		if (initialHierarchy) {
			setHierarchyType(initialHierarchy.type);
			setHierarchyId(String(initialHierarchy.id));
		} else {
			setHierarchyType("category");
			setHierarchyId("");
		}
		setFile(null);
	}, [open, initialHierarchy]);

	const options = { category: categories, subcategory: subcategories, product: products }[hierarchyType];
	const optionLabel = (opt) => opt.name ?? opt.title;

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!file || !hierarchyId) return;
		onSubmit({ file, hierarchyType, hierarchyId });
	};

	return (
		<Modal open={open} onClose={onClose} title="Excel ile Varyant Yükle">
			<form onSubmit={handleSubmit} className="space-y-4">
				{locked ? (
					<FormField label="Hedef">
						<div className="border border-border-gray bg-button-gray px-3 py-2 text-sm text-text-dark">
							{HIERARCHY_LABELS[initialHierarchy.type]}: {initialHierarchy.label}
						</div>
					</FormField>
				) : (
					<>
						<FormField label="Hedef Tipi">
							<select
								value={hierarchyType}
								onChange={(e) => {
									setHierarchyType(e.target.value);
									setHierarchyId("");
								}}
								className={selectClass}
							>
								{Object.entries(HIERARCHY_LABELS).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</FormField>

						<FormField label={HIERARCHY_LABELS[hierarchyType]}>
							<select value={hierarchyId} onChange={(e) => setHierarchyId(e.target.value)} className={selectClass}>
								<option value="">Seçiniz</option>
								{options.map((opt) => (
									<option key={opt.id} value={opt.id}>
										{optionLabel(opt)}
									</option>
								))}
							</select>
						</FormField>
					</>
				)}

				<FormField label="Excel Dosyası (.xlsx)">
					<input
						type="file"
						accept=".xlsx,.xls"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="w-full text-sm text-text-dark"
					/>
				</FormField>

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={isLoading} disabled={!file || !hierarchyId}>
						Yükle
					</Button>
				</div>
			</form>
		</Modal>
	);
}
