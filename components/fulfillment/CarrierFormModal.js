"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass } from "@/components/ui/FormField";

const schema = yup.object({
	name: yup.string().required("İsim zorunlu"),
	vkn: yup.string().nullable(),
});

export default function CarrierFormModal({ open, onClose, initialValues, onSubmit, isLoading }) {
	const isEdit = Boolean(initialValues);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({ resolver: yupResolver(schema), defaultValues: { name: "", vkn: "" } });

	useEffect(() => {
		if (open) {
			reset({ name: initialValues?.name ?? "", vkn: initialValues?.vkn ?? "" });
		}
	}, [open, initialValues, reset]);

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "Kargo Firmasını Düzenle" : "Yeni Kargo Firması"} maxWidth="max-w-sm">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<FormField label="İsim" error={errors.name}>
					<input {...register("name")} className={inputClass} autoFocus />
				</FormField>
				<FormField label="VKN" error={errors.vkn}>
					<input {...register("vkn")} className={inputClass} />
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
