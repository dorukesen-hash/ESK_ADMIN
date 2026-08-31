"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, selectClass, checkboxClass } from "@/components/ui/FormField";

const schema = yup.object({
	code: yup.string().required("Kod zorunlu"),
	type: yup.string().oneOf(["percent", "fixed"]).required(),
	value: yup.number().typeError("Sayı olmalı").required("Değer zorunlu"),
	minOrderAmount: yup.string(),
	validFrom: yup.string(),
	validUntil: yup.string(),
	maxUses: yup.string(),
	maxUsesPerCustomer: yup.string(),
});

const emptyValues = {
	code: "",
	type: "percent",
	value: "",
	minOrderAmount: "",
	validFrom: "",
	validUntil: "",
	maxUses: "",
	maxUsesPerCustomer: "",
	isActive: true,
	firstOrderOnly: false,
};

// Sequelize returns validFrom/validUntil as full ISO timestamps - trim to
// yyyy-mm-dd for the <input type="date"> value.
const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

export default function DiscountCodeFormModal({ open, onClose, initialValues, onSubmit, isLoading }) {
	const isEdit = Boolean(initialValues);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({ resolver: yupResolver(schema), defaultValues: emptyValues });

	useEffect(() => {
		if (open) {
			reset(
				initialValues
					? {
							code: initialValues.code ?? "",
							type: initialValues.type ?? "percent",
							value: initialValues.value ?? "",
							minOrderAmount: initialValues.minOrderAmount ?? "",
							validFrom: toDateInput(initialValues.validFrom),
							validUntil: toDateInput(initialValues.validUntil),
							maxUses: initialValues.maxUses ?? "",
							maxUsesPerCustomer: initialValues.maxUsesPerCustomer ?? "",
							isActive: initialValues.isActive ?? true,
							firstOrderOnly: initialValues.firstOrderOnly ?? false,
						}
					: emptyValues
			);
		}
	}, [open, initialValues, reset]);

	const submit = (values) => {
		onSubmit({
			code: values.code.trim(),
			type: values.type,
			value: Number(values.value),
			minOrderAmount: values.minOrderAmount === "" ? null : Number(values.minOrderAmount),
			validFrom: values.validFrom || null,
			validUntil: values.validUntil || null,
			maxUses: values.maxUses === "" ? null : Number(values.maxUses),
			maxUsesPerCustomer: values.maxUsesPerCustomer === "" ? null : Number(values.maxUsesPerCustomer),
			isActive: values.isActive,
			firstOrderOnly: values.firstOrderOnly,
		});
	};

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "İndirim Kodunu Düzenle" : "Yeni İndirim Kodu"} maxWidth="max-w-lg">
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<FormField label="Kod" error={errors.code}>
						<input {...register("code")} className={inputClass} autoFocus placeholder="ör. WELCOME10" />
					</FormField>

					<FormField label="Tip" error={errors.type}>
						<select {...register("type")} className={selectClass}>
							<option value="percent">Yüzde (%)</option>
							<option value="fixed">Sabit Tutar ($)</option>
						</select>
					</FormField>
				</div>

				<FormField label="Değer" error={errors.value}>
					<input type="number" step="0.01" {...register("value")} className={inputClass} />
				</FormField>

				<FormField label="Minimum Sipariş Tutarı (opsiyonel)" error={errors.minOrderAmount}>
					<input type="number" step="0.01" {...register("minOrderAmount")} className={inputClass} placeholder="Sınırsız" />
				</FormField>

				<div className="grid grid-cols-2 gap-4">
					<FormField label="Geçerlilik Başlangıcı (opsiyonel)" error={errors.validFrom}>
						<input type="date" {...register("validFrom")} className={inputClass} />
					</FormField>
					<FormField label="Geçerlilik Bitişi (opsiyonel)" error={errors.validUntil}>
						<input type="date" {...register("validUntil")} className={inputClass} />
					</FormField>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<FormField label="Toplam Kullanım Limiti (opsiyonel)" error={errors.maxUses}>
						<input type="number" {...register("maxUses")} className={inputClass} placeholder="Sınırsız" />
					</FormField>
					<FormField label="Müşteri Başına Limit (opsiyonel)" error={errors.maxUsesPerCustomer}>
						<input type="number" {...register("maxUsesPerCustomer")} className={inputClass} placeholder="Sınırsız" />
					</FormField>
				</div>

				<div className="flex flex-col gap-2">
					<label className="flex items-center gap-2 text-sm text-text-dark">
						<input type="checkbox" {...register("isActive")} className={checkboxClass} />
						Aktif
					</label>
					<label className="flex items-center gap-2 text-sm text-text-dark">
						<input type="checkbox" {...register("firstOrderOnly")} className={checkboxClass} />
						Sadece ilk siparişte, otomatik uygulansın (kod girmeye gerek yok)
					</label>
				</div>

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
