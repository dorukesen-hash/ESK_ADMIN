"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, checkboxClass } from "@/components/ui/FormField";

const schema = yup.object({
	title: yup.string().required("Başlık zorunlu"),
	stock: yup.string().nullable(),
	one_four_units: yup.number().nullable().transform((v, orig) => (orig === "" ? null : v)),
	five_nine_units: yup.number().nullable().transform((v, orig) => (orig === "" ? null : v)),
	ten_plus_units: yup.number().nullable().transform((v, orig) => (orig === "" ? null : v)),
	available: yup.boolean(),
});

// Variant has ~90 attribute-sheet fields (dimensions, packaging, material specs -
// one column per unit-of-measure companion). Editing all of those by hand isn't
// realistic; this exposes only what an admin actually adjusts day-to-day. Full
// attribute data is populated/replaced via the Excel bulk upload.
export default function VariantQuickEditModal({ open, onClose, variant, onSubmit, isLoading }) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({ resolver: yupResolver(schema) });

	useEffect(() => {
		if (open && variant) {
			reset({
				title: variant.title ?? "",
				stock: variant.stock ?? "",
				one_four_units: variant.one_four_units ?? "",
				five_nine_units: variant.five_nine_units ?? "",
				ten_plus_units: variant.ten_plus_units ?? "",
				available: variant.available ?? false,
			});
		}
	}, [open, variant, reset]);

	const submit = (values) => onSubmit({ id: variant.id, ...values });

	return (
		<Modal open={open} onClose={onClose} title="Varyantı Düzenle">
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField label="Başlık" error={errors.title}>
					<input {...register("title")} className={inputClass} autoFocus />
				</FormField>

				<FormField label="Stok #" error={errors.stock}>
					<input {...register("stock")} className={inputClass} />
				</FormField>

				<div className="grid grid-cols-3 gap-3">
					<FormField label="1-4 Adet" error={errors.one_four_units}>
						<input type="number" step="0.01" {...register("one_four_units")} className={inputClass} />
					</FormField>
					<FormField label="5-9 Adet" error={errors.five_nine_units}>
						<input type="number" step="0.01" {...register("five_nine_units")} className={inputClass} />
					</FormField>
					<FormField label="10+ Adet" error={errors.ten_plus_units}>
						<input type="number" step="0.01" {...register("ten_plus_units")} className={inputClass} />
					</FormField>
				</div>

				<label className="flex items-center gap-2 text-sm text-text-dark">
					<input type="checkbox" {...register("available")} className={checkboxClass} />
					Satışa açık
				</label>

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={isLoading}>
						Kaydet
					</Button>
				</div>
			</form>
		</Modal>
	);
}
