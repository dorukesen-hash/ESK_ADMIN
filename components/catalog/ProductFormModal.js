"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, {
	inputClass,
	selectClass,
	textareaClass,
	checkboxClass,
} from "@/components/ui/FormField";

const schema = yup.object({
	title: yup.string().required("Başlık zorunlu"),
	categoryId: yup.string().required("Kategori zorunlu"),
	subcategoryId: yup.string().required("Alt kategori zorunlu"),
	description: yup.string().nullable(),
	sku: yup.string().nullable(),
	available: yup.boolean(),
});

export default function ProductFormModal({
	open,
	onClose,
	categories,
	subcategories,
	initialValues,
	onSubmit,
	isLoading,
}) {
	const isEdit = Boolean(initialValues);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			title: "",
			categoryId: "",
			subcategoryId: "",
			description: "",
			sku: "",
			available: false,
		},
	});

	useEffect(() => {
		if (open) {
			reset({
				title: initialValues?.title ?? "",
				categoryId: initialValues?.categoryId ? String(initialValues.categoryId) : "",
				subcategoryId: initialValues?.subcategoryId ? String(initialValues.subcategoryId) : "",
				description: initialValues?.description ?? "",
				sku: initialValues?.sku ?? "",
				available: initialValues?.available ?? false,
			});
		}
	}, [open, initialValues, reset]);

	const selectedCategoryId = watch("categoryId");

	const filteredSubcategories = useMemo(
		() => subcategories.filter((sc) => String(sc.categoryId) === String(selectedCategoryId)),
		[subcategories, selectedCategoryId]
	);

	const submit = (values) => {
		onSubmit({
			...values,
			categoryId: Number(values.categoryId),
			subcategoryId: Number(values.subcategoryId),
			list_items: [],
		});
	};

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "Ürünü Düzenle" : "Yeni Ürün"}>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField label="Başlık" error={errors.title}>
					<input {...register("title")} className={inputClass} autoFocus />
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

				<FormField label="Alt Kategori" error={errors.subcategoryId}>
					<select {...register("subcategoryId")} className={selectClass} disabled={!selectedCategoryId}>
						<option value="">Seçiniz</option>
						{filteredSubcategories.map((sc) => (
							<option key={sc.id} value={sc.id}>
								{sc.name}
							</option>
						))}
					</select>
				</FormField>

				{isEdit && (
					<FormField label="SKU" error={errors.sku}>
						<input {...register("sku")} className={inputClass} />
					</FormField>
				)}

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
