"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, selectClass, checkboxClass } from "@/components/ui/FormField";
import { ALL_VARIANT_FIELDS } from "@/components/catalog/variantFieldConfig";
import { useUpdateVariantField } from "@/hooks/catalog/useVariants";
import { notifySuccess, notifyError } from "@/lib/toast";

const EDITABLE_FIELDS = ALL_VARIANT_FIELDS.filter((f) => f.type !== "readonly");

// Sets ONE field to ONE value across every selected row. Reuses the same
// per-cell PUT (id, field: value) the grid's own autosave uses - each row is
// an independent request (Promise.allSettled), so one bad row doesn't block
// the rest, and every successful one still goes through the existing
// audit-log wiring on updateVariantForAdmin.
export default function BulkEditModal({ open, onClose, variantIds = [], onApplied }) {
	const [fieldKey, setFieldKey] = useState(EDITABLE_FIELDS[0]?.key ?? "");
	const [value, setValue] = useState("");
	const [booleanValue, setBooleanValue] = useState(false);
	const [isApplying, setIsApplying] = useState(false);
	const { mutateAsync: saveVariantField } = useUpdateVariantField();

	const field = EDITABLE_FIELDS.find((f) => f.key === fieldKey);

	const handleApply = async (e) => {
		e.preventDefault();
		if (!field) return;

		let finalValue = value;
		if (field.type === "boolean") {
			finalValue = booleanValue;
		} else if (field.type === "number") {
			finalValue = value === "" ? null : Number(value);
			if (finalValue !== null && Number.isNaN(finalValue)) {
				notifyError("Enter a valid number.");
				return;
			}
			if (finalValue !== null && !field.decimal) finalValue = Math.round(finalValue);
		}

		setIsApplying(true);
		const results = await Promise.allSettled(
			variantIds.map((id) => saveVariantField({ id, field: field.key, value: finalValue }))
		);
		setIsApplying(false);

		const failed = results.filter((r) => r.status === "rejected").length;
		const succeeded = results.length - failed;

		if (failed === 0) {
			notifySuccess(`Updated ${succeeded} variant${succeeded === 1 ? "" : "s"}.`);
		} else {
			notifyError(`${succeeded} updated, ${failed} failed.`);
		}

		onApplied?.();
		onClose();
	};

	return (
		<Modal open={open} onClose={onClose} title="Bulk Edit" maxWidth="max-w-sm">
			<form onSubmit={handleApply} className="space-y-4">
				<p className="text-sm text-text-light">
					Set one field for all <span className="font-semibold text-text-dark">{variantIds.length}</span>{" "}
					selected variants.
				</p>

				<FormField label="Field">
					<select
						value={fieldKey}
						onChange={(e) => {
							setFieldKey(e.target.value);
							setValue("");
							setBooleanValue(false);
						}}
						className={selectClass}
					>
						{EDITABLE_FIELDS.map((f) => (
							<option key={f.key} value={f.key}>
								{f.label}
							</option>
						))}
					</select>
				</FormField>

				{field?.type === "boolean" ? (
					<label className="flex items-center gap-2 text-sm text-text-dark">
						<input
							type="checkbox"
							checked={booleanValue}
							onChange={(e) => setBooleanValue(e.target.checked)}
							className={checkboxClass}
						/>
						{field.label}
					</label>
				) : (
					<FormField label="New value">
						<input
							type={field?.type === "number" ? "number" : "text"}
							value={value}
							onChange={(e) => setValue(e.target.value)}
							className={inputClass}
							autoFocus
						/>
					</FormField>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" isLoading={isApplying} disabled={variantIds.length === 0}>
						Apply
					</Button>
				</div>
			</form>
		</Modal>
	);
}
