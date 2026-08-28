"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, {
	inputClass,
	selectClass,
	textareaClass,
	checkboxClass,
} from "@/components/ui/FormField";

const schema = yup.object({
	name: yup.string().required("İsim zorunlu"),
	categoryId: yup.string().required("Kategori zorunlu"),
	description: yup.string().nullable(),
	available: yup.boolean(),
});

export default function SubcategoryFormModal({
	open,
	onClose,
	categories,
	initialValues,
	onSubmit,
	isLoading,
}) {
	const isEdit = Boolean(initialValues);

	// Subcategory's own description lives in a separate Description row (description_id
	// FK), not inline on the list response - fetch it so editing never silently blanks it.
	const { data: existingDescription } = useQuery({
		queryKey: ["description", initialValues?.description_id],
		queryFn: async () => {
			const { data } = await api.get(`/description/${initialValues.description_id}`);
			return data;
		},
		enabled: open && isEdit && Boolean(initialValues?.description_id),
	});

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: { name: "", categoryId: "", description: "", available: false },
	});

	useEffect(() => {
		if (open) {
			reset({
				name: initialValues?.name ?? "",
				categoryId: initialValues?.categoryId ? String(initialValues.categoryId) : "",
				description: "",
				available: initialValues?.available ?? false,
			});
		}
	}, [open, initialValues, reset]);

	useEffect(() => {
		if (existingDescription) {
			setValue("description", existingDescription.text ?? "");
		}
	}, [existingDescription, setValue]);

	const submit = (values) => {
		onSubmit({
			...values,
			categoryId: Number(values.categoryId),
			description_id: initialValues?.description_id,
			list_items: existingDescription?.list_items ?? [],
		});
	};

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "Alt Kategoriyi Düzenle" : "Yeni Alt Kategori"}>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField label="İsim" error={errors.name}>
					<input {...register("name")} className={inputClass} autoFocus />
				</FormField>

				<FormField label="Kategori" error={errors.categoryId}>
					<select {...register("categoryId")} className={selectClass}>
						<option value="">Seçiniz</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</FormField>

				<FormField label="Açıklama" error={errors.description}>
					<textarea {...register("description")} rows={3} className={textareaClass} />
				</FormField>

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
