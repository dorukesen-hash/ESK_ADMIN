"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormField, { inputClass, textareaClass } from "@/components/ui/FormField";
import { notifySuccess, notifyError } from "@/lib/toast";

// field: { name, label, type: "text" | "number" | "textarea" | "list" }
// "list" fields (Sequelize ARRAY(STRING) columns, e.g. bullet points) are edited
// as newline-separated text and split/joined on load/submit - not shown as a
// DataTable column since an array doesn't render well inline.
export default function AttributeCrudPage({ title, fields, useList, useCreate, useUpdate, useDelete }) {
	const { data: rows = [], isLoading } = useList();
	const createItem = useCreate();
	const updateItem = useUpdate();
	const deleteItem = useDelete();

	const [formOpen, setFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [deletingItem, setDeletingItem] = useState(null);
	const [values, setValues] = useState({});

	useEffect(() => {
		if (formOpen) {
			const initial = {};
			fields.forEach((f) => {
				const raw = editingItem?.[f.name];
				initial[f.name] = f.type === "list" ? (raw ?? []).join("\n") : (raw ?? "");
			});
			setValues(initial);
		}
	}, [formOpen, editingItem, fields]);

	const openCreate = () => {
		setEditingItem(null);
		setFormOpen(true);
	};

	const openEdit = (item) => {
		setEditingItem(item);
		setFormOpen(true);
	};

	const handleChange = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

	const buildPayload = () => {
		const payload = {};
		fields.forEach((f) => {
			if (f.type === "number") {
				payload[f.name] = values[f.name] === "" ? null : Number(values[f.name]);
			} else if (f.type === "list") {
				payload[f.name] = (values[f.name] ?? "")
					.split("\n")
					.map((line) => line.trim())
					.filter(Boolean);
			} else {
				payload[f.name] = values[f.name];
			}
		});
		return payload;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const payload = buildPayload();
			if (editingItem) {
				await updateItem.mutateAsync({ id: editingItem.id, ...payload });
				notifySuccess("Güncellendi.");
			} else {
				await createItem.mutateAsync(payload);
				notifySuccess("Eklendi.");
			}
			setFormOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteItem.mutateAsync(deletingItem.id);
			notifySuccess("Silindi.");
			setDeletingItem(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title={title}
				action={
					<Button onClick={openCreate}>
						<span className="flex items-center gap-1">
							<Plus size={16} /> Yeni Kayıt
						</span>
					</Button>
				}
			/>

			<DataTable
				isLoading={isLoading}
				rows={rows}
				getRowId={(row) => row.id}
				emptyMessage="Kayıt bulunamadı"
				columns={fields
					.filter((f) => f.type !== "list")
					.map((f) => ({ key: f.name, header: f.label, render: (row) => row[f.name] ?? "-" }))}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button type="button" onClick={() => openEdit(row)} className="text-text-light hover:text-custom-blue">
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingItem(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingItem ? "Kaydı Düzenle" : "Yeni Kayıt"}>
				<form onSubmit={handleSubmit} className="space-y-4">
					{fields.map((f) => (
						<FormField key={f.name} label={f.label}>
							{f.type === "textarea" || f.type === "list" ? (
								<textarea
									value={values[f.name] ?? ""}
									onChange={(e) => handleChange(f.name, e.target.value)}
									rows={f.type === "list" ? 4 : 3}
									placeholder={f.type === "list" ? "Her satıra bir madde" : undefined}
									className={textareaClass}
								/>
							) : (
								<input
									type={f.type === "number" ? "number" : "text"}
									step={f.type === "number" ? "0.01" : undefined}
									value={values[f.name] ?? ""}
									onChange={(e) => handleChange(f.name, e.target.value)}
									className={inputClass}
								/>
							)}
						</FormField>
					))}
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
							Vazgeç
						</Button>
						<Button type="submit" isLoading={createItem.isPending || updateItem.isPending}>
							Kaydet
						</Button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={Boolean(deletingItem)}
				onClose={() => setDeletingItem(null)}
				onConfirm={handleDelete}
				title="Kaydı sil"
				description="Bu kaydı silmek istediğinize emin misiniz?"
				isLoading={deleteItem.isPending}
			/>
		</div>
	);
}
