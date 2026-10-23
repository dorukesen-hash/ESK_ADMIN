"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField, { inputClass, textareaClass, checkboxClass } from "@/components/ui/FormField";
import CatalogNodePicker from "./CatalogNodePicker";
import { collectDescendantIds } from "@/lib/catalogNodeTree";

const schema = yup.object({
	name: yup.string().required("İsim zorunlu"),
	description: yup.string().nullable(),
	sku: yup.string().nullable(),
	available: yup.boolean(),
	parentId: yup.string().nullable(),
});

export default function CatalogNodeFormModal({
	open,
	onClose,
	tree,
	initialValues,
	defaultParentId,
	onSubmit,
	isLoading,
}) {
	const isEdit = Boolean(initialValues);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: { name: "", description: "", sku: "", available: false, parentId: "" },
	});

	useEffect(() => {
		if (open) {
			reset({
				name: initialValues?.name ?? "",
				description: initialValues?.description ?? "",
				sku: initialValues?.sku ?? "",
				available: initialValues?.available ?? false,
				parentId:
					initialValues?.parentId != null
						? String(initialValues.parentId)
						: defaultParentId != null
						? String(defaultParentId)
						: "__root__",
			});
		}
	}, [open, initialValues, defaultParentId, reset]);

	// A node can't become its own parent, or the parent of any of its own
	// descendants - excluded from the picker outright rather than left to
	// fail server-side once chosen (see updateNode's cycle guard in ESK_API).
	const excludeIds = useMemo(
		() => (isEdit ? collectDescendantIds(tree, initialValues.id) : []),
		[isEdit, tree, initialValues]
	);

	const parentId = watch("parentId");

	const submit = (values) => {
		onSubmit({
			name: values.name,
			description: values.description || null,
			sku: values.sku || null,
			available: values.available,
			parentId: values.parentId === "__root__" || !values.parentId ? null : Number(values.parentId),
		});
	};

	return (
		<Modal open={open} onClose={onClose} title={isEdit ? "Node'u Düzenle" : "Yeni Node"}>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				<FormField label="İsim" error={errors.name}>
					<input {...register("name")} className={inputClass} autoFocus />
				</FormField>

				<FormField label="Üst Node" error={errors.parentId}>
					<CatalogNodePicker
						tree={tree}
						value={parentId}
						onChange={(value) => setValue("parentId", value)}
						excludeIds={excludeIds}
						includeRootOption
						placeholder="Seçiniz"
					/>
				</FormField>

				<FormField label="SKU" error={errors.sku}>
					<input {...register("sku")} className={inputClass} />
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
