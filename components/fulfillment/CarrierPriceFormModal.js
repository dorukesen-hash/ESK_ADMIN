"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, selectClass } from "@/components/ui/FormField";

const schema = yup.object({
	price: yup.number().typeError("Sayı olmalı").required("Fiyat zorunlu"),
	carrierId: yup.string().required("Kargo firması zorunlu"),
	deciId: yup.string().nullable(),
});

export default function CarrierPriceFormModal({ open, onClose, carriers, deciList, initialValues, onSubmit, isLoading }) {
	const isEdit = Boolean(initialValues);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({ resolver: yupResolver(schema), defaultValues: { price: "", carrierId: "", deciId: "" } });

	useEffect(() => {
		if (open) {
			reset({
				price: initialValues?.price ?? "",
				carrierId: initialValues?.carrierId ? String(initialValues.carrierId) : "",
				deciId: initialValues?.deciId ? String(initialValues.deciId) : "",
			});
		}
	}, [open, initialValues, reset]);

	const submit = (values) => {
		onSubmit({
			price: Number(values.price),
			carrierId: Number(values.carrierId),
			deciId: values.deciId ? Number(values.deciId) : null,
		});
	};

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "Kargo Fiyatını Düzenle" : "Yeni Kargo Fiyatı"} maxWidth="max-w-sm">
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField label="Fiyat" error={errors.price}>
					<input type="number" step="0.01" {...register("price")} className={inputClass} autoFocus />
				</FormField>

				<FormField label="Kargo Firması" error={errors.carrierId}>
					<select {...register("carrierId")} className={selectClass}>
						<option value="">Seçiniz</option>
						{carriers.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</FormField>

				<FormField label="Desi Aralığı" error={errors.deciId}>
					<select {...register("deciId")} className={selectClass}>
						<option value="">Yok</option>
						{deciList.map((d) => (
							<option key={d.id} value={d.id}>
								{d.min} - {d.max}
							</option>
						))}
					</select>
				</FormField>

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
